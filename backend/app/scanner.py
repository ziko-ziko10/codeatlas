"""
Multi-language repository scanner
"""
import os
import re
import ast
from pathlib import Path
from typing import List, Dict, Set, Optional
from datetime import datetime
import time

from app.config import (
    IGNORED_DIRECTORIES,
    LANGUAGE_EXTENSIONS,
    SUPPORTED_EXTENSIONS,
    MAX_FILE_SIZE,
)
from app.models import FileInfo, FolderSummary, LanguageSummary, RepositoryMetadata, ScanResult
from app.risk import calculate_risk_score, calculate_complexity_estimate


class RepositoryScanner:
    """Scans a repository and extracts metadata, dependencies, and risk metrics"""
    
    def __init__(self, repo_path: str, include_hidden: bool = False, max_depth: Optional[int] = None):
        self.repo_path = Path(repo_path).resolve()
        self.include_hidden = include_hidden
        self.max_depth = max_depth
        self.files: List[FileInfo] = []
        self.folders: Dict[str, FolderSummary] = {}
        
        if not self.repo_path.exists():
            raise ValueError(f"Repository path does not exist: {repo_path}")
        if not self.repo_path.is_dir():
            raise ValueError(f"Path is not a directory: {repo_path}")
    
    def scan(self) -> ScanResult:
        """
        Scan the repository and return complete analysis.
        
        Returns:
            ScanResult with all metadata, files, and folders
        """
        start_time = time.time()
        
        # Scan all files
        self._scan_directory(self.repo_path, depth=0)
        
        # Calculate folder summaries
        self._calculate_folder_summaries()
        
        # Calculate language summaries
        language_summaries = self._calculate_language_summaries()
        
        # Calculate repository metadata
        total_lines = sum(f.lines_of_code for f in self.files)
        total_size = sum(f.size_bytes for f in self.files)
        
        scan_duration = time.time() - start_time
        
        metadata = RepositoryMetadata(
            path=str(self.repo_path),
            name=self.repo_path.name,
            total_files=len(self.files),
            total_lines=total_lines,
            total_size_bytes=total_size,
            scanned_at=datetime.now(),
            scan_duration_seconds=round(scan_duration, 2),
            languages=language_summaries,
        )
        
        # Create summary statistics
        summary = {
            "high_risk_files": len([f for f in self.files if f.risk_level in ["high", "critical"]]),
            "avg_risk_score": round(sum(f.risk_score for f in self.files) / len(self.files), 2) if self.files else 0,
            "total_todos": sum(f.todo_count for f in self.files),
            "total_fixmes": sum(f.fixme_count for f in self.files),
            "largest_file": max(self.files, key=lambda f: f.lines_of_code).path if self.files else None,
            "most_complex_file": max(self.files, key=lambda f: f.complexity_score).path if self.files else None,
        }
        
        return ScanResult(
            metadata=metadata,
            files=self.files,
            folders=list(self.folders.values()),
            summary=summary,
        )
    
    def _scan_directory(self, directory: Path, depth: int):
        """Recursively scan a directory"""
        if self.max_depth is not None and depth > self.max_depth:
            return
        
        try:
            for entry in directory.iterdir():
                # Skip hidden files/folders if not included
                if not self.include_hidden and entry.name.startswith('.'):
                    continue
                
                if entry.is_dir():
                    # Skip ignored directories
                    if entry.name in IGNORED_DIRECTORIES:
                        continue
                    self._scan_directory(entry, depth + 1)
                
                elif entry.is_file():
                    # Check if file extension is supported
                    if entry.suffix in SUPPORTED_EXTENSIONS:
                        file_info = self._analyze_file(entry)
                        if file_info:
                            self.files.append(file_info)
        
        except PermissionError:
            # Skip directories we don't have permission to read
            pass
    
    def _analyze_file(self, file_path: Path) -> Optional[FileInfo]:
        """Analyze a single file and extract metrics"""
        try:
            # Check file size
            size = file_path.stat().st_size
            if size > MAX_FILE_SIZE:
                return None
            
            # Read file content
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
            except UnicodeDecodeError:
                # Skip binary files
                return None
            
            # Determine language
            language = self._get_language(file_path.suffix)
            if not language:
                return None
            
            # Count lines
            lines = content.split('\n')
            lines_of_code = len([line for line in lines if line.strip() and not line.strip().startswith('#')])
            
            # Count TODO/FIXME
            todo_count = len(re.findall(r'\bTODO\b', content, re.IGNORECASE))
            fixme_count = len(re.findall(r'\bFIXME\b', content, re.IGNORECASE))
            
            # Language-specific analysis
            if language == "python":
                metrics = self._analyze_python(content)
            elif language in ["javascript", "typescript"]:
                metrics = self._analyze_javascript(content)
            elif language == "java":
                metrics = self._analyze_java(content)
            else:
                metrics = {
                    "import_count": 0,
                    "function_count": 0,
                    "class_count": 0,
                    "nesting_indicators": 0,
                }
            
            # Calculate complexity
            complexity = calculate_complexity_estimate(
                lines_of_code=lines_of_code,
                function_count=metrics["function_count"],
                class_count=metrics["class_count"],
                nesting_indicators=metrics["nesting_indicators"],
            )
            
            # Calculate risk score
            risk_score, risk_level = calculate_risk_score(
                lines_of_code=lines_of_code,
                complexity=complexity,
                todo_fixme_count=todo_count + fixme_count,
                import_count=metrics["import_count"],
                function_count=metrics["function_count"],
            )
            
            # Get relative path
            relative_path = file_path.relative_to(self.repo_path)
            
            return FileInfo(
                path=str(relative_path),
                name=file_path.name,
                extension=file_path.suffix,
                language=language,
                size_bytes=size,
                lines_of_code=lines_of_code,
                import_count=metrics["import_count"],
                function_count=metrics["function_count"],
                class_count=metrics["class_count"],
                todo_count=todo_count,
                fixme_count=fixme_count,
                complexity_score=complexity,
                risk_score=risk_score,
                risk_level=risk_level,
            )
        
        except Exception as e:
            # Skip files that cause errors
            print(f"Error analyzing {file_path}: {e}")
            return None
    
    def _get_language(self, extension: str) -> Optional[str]:
        """Determine language from file extension"""
        for language, extensions in LANGUAGE_EXTENSIONS.items():
            if extension in extensions:
                return language
        return None
    
    def _analyze_python(self, content: str) -> Dict[str, int]:
        """Analyze Python file using AST"""
        try:
            tree = ast.parse(content)
            
            import_count = 0
            function_count = 0
            class_count = 0
            nesting_indicators = 0
            
            for node in ast.walk(tree):
                if isinstance(node, (ast.Import, ast.ImportFrom)):
                    import_count += 1
                elif isinstance(node, ast.FunctionDef):
                    function_count += 1
                elif isinstance(node, ast.ClassDef):
                    class_count += 1
                elif isinstance(node, (ast.If, ast.For, ast.While, ast.Try)):
                    nesting_indicators += 1
            
            return {
                "import_count": import_count,
                "function_count": function_count,
                "class_count": class_count,
                "nesting_indicators": nesting_indicators,
            }
        
        except SyntaxError:
            # If parsing fails, use regex fallback
            return self._analyze_with_regex(content, language="python")
    
    def _analyze_javascript(self, content: str) -> Dict[str, int]:
        """Analyze JavaScript/TypeScript file using regex patterns"""
        return self._analyze_with_regex(content, language="javascript")
    
    def _analyze_java(self, content: str) -> Dict[str, int]:
        """Analyze Java file using regex patterns"""
        return self._analyze_with_regex(content, language="java")
    
    def _analyze_with_regex(self, content: str, language: str) -> Dict[str, int]:
        """Fallback analysis using regex patterns"""
        if language == "python":
            import_pattern = r'^\s*(import|from)\s+'
            function_pattern = r'^\s*def\s+\w+\s*\('
            class_pattern = r'^\s*class\s+\w+'
            nesting_pattern = r'^\s*(if|for|while|try)\s+'
        
        elif language == "javascript":
            import_pattern = r'^\s*(import|require)\s*[\(\{]'
            function_pattern = r'(function\s+\w+\s*\(|const\s+\w+\s*=\s*\(|=>\s*\{)'
            class_pattern = r'^\s*class\s+\w+'
            nesting_pattern = r'^\s*(if|for|while|try)\s*\('
        
        elif language == "java":
            import_pattern = r'^\s*import\s+'
            function_pattern = r'(public|private|protected)?\s*(static)?\s*\w+\s+\w+\s*\('
            class_pattern = r'^\s*(public|private)?\s*class\s+\w+'
            nesting_pattern = r'^\s*(if|for|while|try)\s*\('
        
        else:
            return {
                "import_count": 0,
                "function_count": 0,
                "class_count": 0,
                "nesting_indicators": 0,
            }
        
        lines = content.split('\n')
        
        import_count = len([line for line in lines if re.match(import_pattern, line)])
        function_count = len([line for line in lines if re.search(function_pattern, line)])
        class_count = len([line for line in lines if re.match(class_pattern, line)])
        nesting_indicators = len([line for line in lines if re.match(nesting_pattern, line)])
        
        return {
            "import_count": import_count,
            "function_count": function_count,
            "class_count": class_count,
            "nesting_indicators": nesting_indicators,
        }
    
    def _calculate_folder_summaries(self):
        """Calculate summary statistics for each folder"""
        folder_files: Dict[str, List[FileInfo]] = {}
        
        # Group files by folder
        for file_info in self.files:
            folder_path = str(Path(file_info.path).parent)
            if folder_path not in folder_files:
                folder_files[folder_path] = []
            folder_files[folder_path].append(file_info)
        
        # Calculate summaries
        for folder_path, files in folder_files.items():
            total_lines = sum(f.lines_of_code for f in files)
            avg_risk = sum(f.risk_score for f in files) / len(files) if files else 0
            high_risk_count = len([f for f in files if f.risk_level in ["high", "critical"]])
            
            # Count files by language
            languages: Dict[str, int] = {}
            for file_info in files:
                languages[file_info.language] = languages.get(file_info.language, 0) + 1
            
            self.folders[folder_path] = FolderSummary(
                path=folder_path,
                file_count=len(files),
                total_lines=total_lines,
                languages=languages,
                avg_risk_score=round(avg_risk, 2),
                high_risk_files=high_risk_count,
            )
    
    def _calculate_language_summaries(self) -> List[LanguageSummary]:
        """Calculate summary statistics for each language"""
        language_files: Dict[str, List[FileInfo]] = {}
        
        # Group files by language
        for file_info in self.files:
            if file_info.language not in language_files:
                language_files[file_info.language] = []
            language_files[file_info.language].append(file_info)
        
        # Calculate summaries
        summaries = []
        for language, files in language_files.items():
            total_lines = sum(f.lines_of_code for f in files)
            avg_risk = sum(f.risk_score for f in files) / len(files) if files else 0
            extensions = list(set(f.extension for f in files))
            
            summaries.append(LanguageSummary(
                language=language,
                file_count=len(files),
                total_lines=total_lines,
                avg_risk_score=round(avg_risk, 2),
                extensions=extensions,
            ))
        
        return summaries

# Made with Bob
