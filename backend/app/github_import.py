"""
GitHub repository import - optimized for speed
"""
import os
import re
import subprocess
import shutil
import tarfile
import requests
from pathlib import Path
from typing import Dict, Optional, Tuple, Any, List
from datetime import datetime

# Supported extensions that the scanner can analyze
SCANNABLE_EXTENSIONS = {
    '.py', '.pyw',  # Python
    '.js', '.jsx', '.mjs', '.cjs',  # JavaScript
    '.ts', '.tsx',  # TypeScript
    '.java',  # Java
}


class GitHubImporter:
    """Handle GitHub repository import"""
    
    ALLOWED_DOMAIN = "github.com"
    
    DEFAULT_MAX_FILES = 400
    DEFAULT_MAX_BYTES = 20 * 1024 * 1024  # 20MB
    DEFAULT_MAX_FILE_SIZE = 150 * 1024    # 150KB
    FAST_TIMEOUT = 90
    FULL_CLONE_TIMEOUT = 300
    
    PRIORITY_PATHS = [
        "src", "app", "packages", "apps", "backend", "frontend", "server", 
        "api", "lib", "components", "services", "core", "pages", "internal",
        "modules", "domain", "pkg", "source"
    ]
    
    PRIORITY_FILES = [
        "package.json", "pyproject.toml", "requirements.txt",
        "tsconfig.json", "vite.config.js", "vite.config.ts", "next.config.js",
        "next.config.ts", "Dockerfile", "docker-compose.yml",
        "go.mod", "Cargo.toml", "pom.xml", "Makefile"
    ]
    
    SKIP_PATTERNS = [
        "*.min.js", "*.min.css", "*.map",
        "node_modules/", ".git/", "dist/", "build/", "out/",
        "__pycache__/", ".pytest_cache/", "target/", "vendor/",
        "*.pyc", "*.pyo", ".next/", ".nuxt/", "coverage/",
        "*.lock", "package-lock.json", "yarn.lock",
        "*.so", "*.dll", "*.exe",
        "*.png", "*.jpg", "*.jpeg", "*.gif", "*.ico", "*.svg",
        "*.pdf", "*.zip", "*.tar", "*.gz",
        ".DS_Store", "Thumbs.db"
    ]
    
    def __init__(self, base_tmp_dir: str = "backend/tmp/repos"):
        self.base_tmp_dir = Path(base_tmp_dir)
        self.base_tmp_dir.mkdir(parents=True, exist_ok=True)
    
    def validate_github_url(self, url: str) -> Tuple[bool, Optional[str]]:
        if not url or not isinstance(url, str):
            return False, "URL must be a non-empty string"
        
        url = url.strip().rstrip('/')
        
        if self.ALLOWED_DOMAIN not in url.lower():
            return False, f"Only {self.ALLOWED_DOMAIN} repositories are supported"
        
        if not url.startswith(("http://", "https://")):
            url = "https://" + url
        
        match = re.search(r'github\.com[/:]([\w-]+)/([^\s/]+)', url, re.IGNORECASE)
        if not match:
            return False, "Invalid GitHub URL format"
        
        return True, None
    
    def parse_github_url(self, url: str) -> Dict[str, str]:
        match = re.search(r'github\.com[/:]([\w-]+)/([^\s/]+)', url, re.IGNORECASE)
        if not match:
            raise ValueError("Invalid GitHub URL")
        
        owner, repo = match.groups()
        if repo.endswith('.git'):
            repo = repo[:-4]
        
        return {"owner": owner, "repo": repo}
    
    def _generate_path(self, owner: str, repo: str, mode: str = "fast") -> Path:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        suffix = "_fast" if mode == "fast" else ""
        dir_name = f"{owner}_{repo}{suffix}_{timestamp}"
        
        clone_path = self.base_tmp_dir / dir_name
        base_resolved = self.base_tmp_dir.resolve()
        clone_path = clone_path.resolve()
        
        if not str(clone_path).startswith(str(base_resolved)):
            raise ValueError("Invalid path")
        
        return clone_path
    
    def get_repo_info(self, github_url: str) -> Dict[str, Any]:
        """Get repository info without cloning - size, file count, estimated time"""
        
        is_valid, error_msg = self.validate_github_url(github_url)
        if not is_valid:
            raise ValueError(error_msg)
        
        repo_info = self.parse_github_url(github_url)
        owner = repo_info["owner"]
        repo = repo_info["repo"]
        
        # Get repo metadata
        try:
            resp = requests.get(
                f"https://api.github.com/repos/{owner}/{repo}",
                timeout=10,
                headers={'Accept': 'application/vnd.github.v3+json'}
            )
            resp.raise_for_status()
            data = resp.json()
            
            size_kb = data.get("size", 0)
            stars = data.get("stargazers_count", 0)
            language = data.get("language", "Unknown")
            description = data.get("description", "")
            updated_at = data.get("updated_at", "")
            
            # Get file tree for file count
            branch = data.get("default_branch", "main")
            tree_resp = requests.get(
                f"https://api.github.com/repos/{owner}/{repo}/git/trees/{branch}?recursive=1",
                timeout=15,
                headers={'Accept': 'application/vnd.github.v3+json'}
            )
            
            total_files = 0
            source_files = 0
            if tree_resp.status_code == 200:
                tree = tree_resp.json().get("tree", [])
                total_files = len([t for t in tree if t["type"] == "blob"])
                source_files = len([
                    t for t in tree 
                    if t["type"] == "blob" and Path(t["path"]).suffix.lower() in SCANNABLE_EXTENSIONS
                ])
            
            # Estimate time
            if size_kb > 50000:
                # API tree mode: ~1 file per 0.2s
                est_seconds = min(60, source_files * 0.2)
                mode = "API Tree"
            elif size_kb > 10000:
                # Archive mode
                est_seconds = min(45, size_kb / 1000 * 2)
                mode = "Archive"
            else:
                # Small repo
                est_seconds = min(20, size_kb / 1000 * 3)
                mode = "Archive"
            
            return {
                "owner": owner,
                "repo": repo,
                "full_name": data.get("full_name", f"{owner}/{repo}"),
                "description": description or "",
                "language": language or "Unknown",
                "stars": stars,
                "size_kb": size_kb,
                "size_mb": round(size_kb / 1024, 1),
                "total_files": total_files,
                "source_files": source_files,
                "branch": branch,
                "updated_at": updated_at,
                "estimated_time_seconds": round(est_seconds, 0),
                "estimated_time": self._format_time(est_seconds),
                "import_mode": mode,
                "is_large": size_kb > 50000,
            }
            
        except requests.exceptions.RequestException as e:
            raise ValueError(f"Failed to fetch repo info: {str(e)}")
    
    def _format_time(self, seconds: float) -> str:
        if seconds < 10:
            return "Under 10 seconds"
        elif seconds < 60:
            return f"About {int(seconds)} seconds"
        else:
            mins = int(seconds / 60)
            secs = int(seconds % 60)
            return f"About {mins}m {secs}s"
    
    def clone_repository(self, github_url: str, mode: str = "fast", 
                         max_files: int = DEFAULT_MAX_FILES,
                         max_total_bytes: int = DEFAULT_MAX_BYTES,
                         max_file_size: int = DEFAULT_MAX_FILE_SIZE) -> Dict[str, Any]:
        
        is_valid, error_msg = self.validate_github_url(github_url)
        if not is_valid:
            raise ValueError(error_msg)
        
        repo_info = self.parse_github_url(github_url)
        owner = repo_info["owner"]
        repo = repo_info["repo"]
        
        target_path = self._generate_path(owner, repo, mode)
        target_path.parent.mkdir(parents=True, exist_ok=True)
        
        try:
            if mode == "fast":
                result = self._fast_import(github_url, target_path, owner, repo, 
                                          max_files, max_total_bytes, max_file_size)
            else:
                result = self._full_clone(github_url, target_path, self.FULL_CLONE_TIMEOUT)
                analysis = self._analyze_repo(target_path, max_files, max_total_bytes, max_file_size, "full")
                result["analysis"] = analysis
            
            return {
                "success": True,
                "clone_path": str(target_path),
                "owner": owner,
                "repo": repo,
                "branch": result.get("branch", "main"),
                "url": github_url,
                "mode": mode,
                **result.get("analysis", {})
            }
            
        except Exception as e:
            if target_path.exists():
                shutil.rmtree(target_path, ignore_errors=True)
            raise
    
    def _fast_import(self, url: str, target_path: Path, owner: str, repo: str,
                     max_files: int, max_total_bytes: int, max_file_size: int) -> Dict:
        """
        Fast import: Download archive and extract ONLY source files.
        For very large repos, uses API tree + selective download.
        """
        
        branch = self._detect_branch(owner, repo)
        print(f"Detected branch: {branch}")
        
        # Check repo size first
        repo_size_kb = self._get_repo_size(owner, repo)
        print(f"Repo size: {repo_size_kb / 1024:.1f}MB")
        
        # For repos > 50MB, use API tree + selective download
        if repo_size_kb > 50000:
            print("Large repo detected, using API tree mode")
            return self._api_tree_import(owner, repo, branch, target_path, 
                                         max_files, max_total_bytes, max_file_size)
        
        # Otherwise use archive download
        archive_url = f"https://github.com/{owner}/{repo}/archive/refs/heads/{branch}.tar.gz"
        
        try:
            self._download_and_selective_extract(archive_url, target_path, max_files, max_file_size)
            
            analysis = self._analyze_repo(target_path, max_files, max_total_bytes, max_file_size, "fast")
            
            return {
                "branch": branch,
                "analysis": analysis
            }
            
        except Exception as e:
            print(f"Archive download failed: {e}")
            return self._shallow_clone_fallback(url, target_path, max_files, max_total_bytes, max_file_size)
    
    def _get_repo_size(self, owner: str, repo: str) -> int:
        """Get repo size in KB from GitHub API"""
        try:
            resp = requests.get(
                f"https://api.github.com/repos/{owner}/{repo}",
                timeout=10,
                headers={'Accept': 'application/vnd.github.v3+json'}
            )
            if resp.status_code == 200:
                return resp.json().get("size", 0)
        except:
            pass
        return 0
    
    def _api_tree_import(self, owner: str, repo: str, branch: str,
                         target_path: Path, max_files: int, 
                         max_total_bytes: int, max_file_size: int) -> Dict:
        """Import large repos using GitHub API tree + selective file download"""
        
        tree_url = f"https://api.github.com/repos/{owner}/{repo}/git/trees/{branch}?recursive=1"
        
        try:
            resp = requests.get(tree_url, timeout=30, headers={
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'CodeAtlas'
            })
            resp.raise_for_status()
            tree = resp.json().get("tree", [])
            print(f"Found {len(tree)} items")
            
            # Filter to scannable files
            source_files = []
            for item in tree:
                if item["type"] != "blob":
                    continue
                
                path = item["path"]
                size = item.get("size", 0)
                
                ext = Path(path).suffix.lower()
                if ext not in SCANNABLE_EXTENSIONS:
                    continue
                
                if any(Path(path).match(p) for p in self.SKIP_PATTERNS):
                    continue
                
                if size > max_file_size:
                    continue
                
                priority = self._get_file_priority(path)
                source_files.append({"path": path, "size": size, "priority": priority})
            
            print(f"Found {len(source_files)} scannable files")
            source_files.sort(key=lambda x: x["priority"])
            source_files = source_files[:max_files]
            
            # Download files
            downloaded = 0
            skipped = 0
            total_bytes = 0
            priority_count = 0
            
            for file_info in source_files:
                if downloaded >= max_files:
                    skipped += 1
                    continue
                
                path = file_info["path"]
                raw_url = f"https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}"
                
                try:
                    resp = requests.get(raw_url, timeout=10)
                    if resp.status_code == 200:
                        content = resp.content
                        if len(content) > max_file_size:
                            skipped += 1
                            continue
                        
                        if total_bytes + len(content) > max_total_bytes:
                            skipped += 1
                            continue
                        
                        file_path = target_path / path
                        file_path.parent.mkdir(parents=True, exist_ok=True)
                        file_path.write_bytes(content)
                        
                        downloaded += 1
                        total_bytes += len(content)
                        
                        pl = path.lower()
                        if any(f'/{p}/' in pl or pl.startswith(p + '/') for p in self.PRIORITY_PATHS):
                            priority_count += 1
                    else:
                        skipped += 1
                except:
                    skipped += 1
            
            print(f"Downloaded {downloaded} files")
            
            confidence = "high" if priority_count >= 30 else "medium" if priority_count >= 10 else "low"
            
            return {
                "branch": branch,
                "analysis": {
                    "sampled_files": downloaded,
                    "skipped_files": skipped,
                    "total_bytes": total_bytes,
                    "priority_files": priority_count,
                    "analysis_mode": "fast",
                    "analysis_confidence": confidence,
                    "max_files": max_files,
                    "max_total_bytes": max_total_bytes,
                    "limitations": ["Large repo - analyzed via API tree"]
                }
            }
            
        except Exception as e:
            print(f"API tree import failed: {e}")
            raise
    
    def _get_file_priority(self, path: str) -> int:
        """Get file priority (lower = higher priority)"""
        pl = path.lower()
        
        for i, p in enumerate(self.PRIORITY_PATHS):
            if f'/{p}/' in pl or pl.startswith(p + '/'):
                return i
        
        if Path(path).name.lower() in self.PRIORITY_FILES:
            return -10
        
        if '/test' in pl or '/tests' in pl:
            return 500
        
        return 100
    
    def _download_and_selective_extract(self, archive_url: str, target_path: Path, 
                                         max_files: int, max_file_size: int):
        """Download archive and extract ONLY scannable source files"""
        
        # Retry up to 3 times for connection issues
        last_error = None
        for attempt in range(3):
            try:
                response = requests.get(archive_url, timeout=self.FAST_TIMEOUT, stream=True, allow_redirects=True)
                response.raise_for_status()
                
                if 'text/html' in response.headers.get('content-type', ''):
                    raise Exception("Received HTML instead of archive")
                
                tmp_path = target_path.parent / f"temp_{target_path.name}.tar.gz"
                
                try:
                    total = 0
                    max_size = 100 * 1024 * 1024
                    
                    with open(tmp_path, 'wb') as f:
                        for chunk in response.iter_content(chunk_size=65536):
                            if chunk:
                                f.write(chunk)
                                total += len(chunk)
                                if total > max_size:
                                    raise Exception("Archive too large")
                    
                    print(f"Downloaded {total / 1024:.0f}KB")
                    
                    # Extract ONLY scannable files
                    extracted_count = 0
                    with tarfile.open(tmp_path, 'r:gz') as tar:
                        for member in tar.getmembers():
                            if member.isdir():
                                continue
                            
                            parts = member.name.split('/', 1)
                            if len(parts) < 2:
                                continue
                            rel_path = parts[1]
                            
                            ext = Path(rel_path).suffix.lower()
                            if ext not in SCANNABLE_EXTENSIONS:
                                continue
                            
                            if any(Path(rel_path).match(p) for p in self.SKIP_PATTERNS):
                                continue
                            
                            if member.size > max_file_size:
                                continue
                            
                            if extracted_count >= max_files:
                                continue
                            
                            member.name = rel_path
                            tar.extract(member, target_path)
                            extracted_count += 1
                    
                    print(f"Extracted {extracted_count} source files")
                    return
                    
                finally:
                    if tmp_path.exists():
                        tmp_path.unlink()
                        
            except Exception as e:
                last_error = e
                print(f"Download attempt {attempt + 1} failed: {e}")
                if attempt < 2:
                    import time
                    time.sleep(1)
        
        raise last_error
    
    def _detect_branch(self, owner: str, repo: str) -> str:
        try:
            url = f"https://api.github.com/repos/{owner}/{repo}"
            resp = requests.get(url, timeout=10, headers={'Accept': 'application/vnd.github.v3+json'})
            if resp.status_code == 200:
                return resp.json().get("default_branch", "main")
        except:
            pass
        
        for branch in ["main", "master", "develop"]:
            tree_url = f"https://api.github.com/repos/{owner}/{repo}/git/trees/{branch}"
            try:
                resp = requests.get(tree_url, timeout=5)
                if resp.status_code == 200:
                    return branch
            except:
                continue
        
        return "main"
    
    def _shallow_clone_fallback(self, url: str, target_path: Path, 
                                 max_files: int, max_total_bytes: int, 
                                 max_file_size: int) -> Dict:
        """Fallback to shallow clone"""
        
        print("Falling back to shallow git clone...")
        normalized_url = url.rstrip('/')
        if not normalized_url.endswith('.git'):
            normalized_url += '.git'
        
        try:
            subprocess.run(
                ["git", "clone", "--depth", "1", "--single-branch", 
                 "--filter=blob:limit=100k",
                 normalized_url, str(target_path)],
                capture_output=True,
                check=True,
                timeout=45
            )
            
            branch = self._get_current_branch(target_path)
            analysis = self._analyze_repo(target_path, max_files, max_total_bytes, max_file_size, "fast")
            
            return {"branch": branch, "analysis": analysis}
        except subprocess.TimeoutExpired:
            raise Exception("Clone timed out. Repository may be too large for fast mode.")
        except subprocess.CalledProcessError as e:
            raise Exception(f"Clone failed: {e.stderr.decode()[:200]}")
    
    def _full_clone(self, url: str, clone_path: Path, timeout: int) -> Dict:
        """Full clone"""
        
        normalized_url = url.rstrip('/')
        if not normalized_url.endswith('.git'):
            normalized_url += '.git'
        
        subprocess.run(
            ["git", "clone", "--single-branch", normalized_url, str(clone_path)],
            capture_output=True,
            check=True,
            timeout=timeout
        )
        
        return {"branch": self._get_current_branch(clone_path)}
    
    def _analyze_repo(self, repo_path: Path, max_files: int, 
                      max_total_bytes: int, max_file_size: int,
                      mode: str) -> Dict[str, Any]:
        """Analyze repository"""
        
        sampled = []
        skipped = 0
        total_bytes = 0
        priority_count = 0
        
        all_files = []
        try:
            for root, dirs, files in os.walk(repo_path):
                dirs[:] = [d for d in dirs if not d.startswith('.') and d not in 
                          ['node_modules', 'dist', 'build', 'out', 'target', 'vendor']]
                
                for file in files:
                    filepath = Path(root) / file
                    rel_path = str(filepath.relative_to(repo_path))
                    
                    should_skip = any(filepath.match(p) for p in self.SKIP_PATTERNS)
                    if should_skip:
                        skipped += 1
                        continue
                    
                    try:
                        size = filepath.stat().st_size
                        if size > max_file_size:
                            skipped += 1
                            continue
                        all_files.append((rel_path, size))
                    except:
                        skipped += 1
        except Exception as e:
            print(f"Error: {e}")
        
        def priority_key(item):
            path, size = item
            pl = path.lower()
            
            for i, p in enumerate(self.PRIORITY_PATHS):
                if f'/{p}/' in pl or pl.startswith(p + '/'):
                    return (i, path)
            
            if Path(path).name.lower() in self.PRIORITY_FILES:
                return (100, path)
            
            if '/test' not in pl and '/tests' not in pl:
                return (200, path)
            
            return (300, path)
        
        all_files.sort(key=priority_key)
        
        for rel_path, size in all_files:
            if len(sampled) >= max_files:
                skipped += 1
                continue
            
            if total_bytes + size > max_total_bytes:
                skipped += 1
                continue
            
            sampled.append(rel_path)
            total_bytes += size
            
            pl = rel_path.lower()
            if any(f'/{p}/' in pl or pl.startswith(p + '/') for p in self.PRIORITY_PATHS):
                priority_count += 1
        
        confidence = "high" if priority_count >= 50 else "medium" if priority_count >= 20 else "low"
        
        limitations = ["Fast mode analyzes a subset of files"]
        if priority_count < 20:
            limitations.append("Limited source coverage")
        
        return {
            "sampled_files": len(sampled),
            "skipped_files": skipped,
            "total_bytes": total_bytes,
            "priority_files": priority_count,
            "analysis_mode": mode,
            "analysis_confidence": confidence,
            "max_files": max_files,
            "max_total_bytes": max_total_bytes,
            "limitations": limitations
        }
    
    def _generate_limitations(self, priority_count: int, sampled: int) -> List[str]:
        limitations = ["Fast mode analyzes a subset of files"]
        if priority_count < 20:
            limitations.append("Limited source coverage")
        return limitations
    
    def _get_current_branch(self, repo_path: Path) -> str:
        try:
            result = subprocess.run(
                ["git", "-C", str(repo_path), "rev-parse", "--abbrev-ref", "HEAD"],
                capture_output=True, text=True, timeout=10
            )
            return result.stdout.strip() or "main"
        except:
            return "main"
    
    def cleanup_repository(self, clone_path: str):
        try:
            path = Path(clone_path)
            if path.exists() and str(path).startswith(str(self.base_tmp_dir.resolve())):
                shutil.rmtree(path, ignore_errors=True)
        except:
            pass
