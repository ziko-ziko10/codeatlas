"""
Dependency graph and blast radius analysis
"""
import ast
import re
from pathlib import Path
from typing import Dict, List, Set, Tuple, Optional
from collections import defaultdict

from app.models import FileInfo


class DependencyGraph:
    """Build and analyze dependency graphs for codebases"""
    
    def __init__(self, files: List[FileInfo], repo_path: str):
        self.files = files
        self.repo_path = Path(repo_path)
        self.file_map: Dict[str, FileInfo] = {f.path: f for f in files}
        
        # Graph structure
        self.edges: List[Tuple[str, str]] = []  # (from_file, to_file)
        self.dependencies: Dict[str, Set[str]] = defaultdict(set)  # file -> dependencies
        self.dependents: Dict[str, Set[str]] = defaultdict(set)  # file -> dependents
        
        # Metrics
        self.in_degree: Dict[str, int] = {}
        self.out_degree: Dict[str, int] = {}
        self.centrality: Dict[str, float] = {}
    
    def build_graph(self) -> Dict:
        """
        Build the dependency graph by analyzing all files.
        
        Returns:
            Graph data with nodes, edges, and metrics
        """
        # Extract dependencies for each file
        for file_info in self.files:
            file_path = self.repo_path / file_info.path
            if file_path.exists():
                deps = self._extract_dependencies(file_path, file_info.language)
                
                # Resolve dependencies to actual files in the project
                resolved_deps = self._resolve_dependencies(file_info.path, deps)
                
                for dep in resolved_deps:
                    self.dependencies[file_info.path].add(dep)
                    self.dependents[dep].add(file_info.path)
                    self.edges.append((file_info.path, dep))
        
        # Calculate metrics
        self._calculate_metrics()
        
        # Build graph output
        return self._build_graph_output()
    
    def _extract_dependencies(self, file_path: Path, language: str) -> Set[str]:
        """Extract import/require statements from a file"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            if language == "python":
                return self._extract_python_imports(content)
            elif language in ["javascript", "typescript"]:
                return self._extract_js_imports(content)
            else:
                return set()
        
        except Exception as e:
            print(f"Error extracting dependencies from {file_path}: {e}")
            return set()
    
    def _extract_python_imports(self, content: str) -> Set[str]:
        """Extract Python imports using AST"""
        imports = set()
        
        try:
            tree = ast.parse(content)
            
            for node in ast.walk(tree):
                if isinstance(node, ast.Import):
                    for alias in node.names:
                        imports.add(alias.name.split('.')[0])
                
                elif isinstance(node, ast.ImportFrom):
                    if node.module:
                        imports.add(node.module.split('.')[0])
        
        except SyntaxError:
            # Fallback to regex if AST parsing fails
            imports.update(self._extract_python_imports_regex(content))
        
        return imports
    
    def _extract_python_imports_regex(self, content: str) -> Set[str]:
        """Fallback Python import extraction using regex"""
        imports = set()
        
        # Match: import x, import x.y.z
        import_pattern = r'^\s*import\s+([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*)'
        for match in re.finditer(import_pattern, content, re.MULTILINE):
            imports.add(match.group(1).split('.')[0])
        
        # Match: from x import y, from x.y import z
        from_pattern = r'^\s*from\s+([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*)\s+import'
        for match in re.finditer(from_pattern, content, re.MULTILINE):
            imports.add(match.group(1).split('.')[0])
        
        return imports
    
    def _extract_js_imports(self, content: str) -> Set[str]:
        """Extract JavaScript/TypeScript imports using regex"""
        imports = set()
        
        # ES6 imports: import x from "y", import { x } from "y"
        es6_pattern = r'import\s+(?:[\w\s{},*]+\s+from\s+)?["\']([^"\']+)["\']'
        for match in re.finditer(es6_pattern, content):
            imports.add(match.group(1))
        
        # CommonJS require: require("x"), const x = require("x")
        require_pattern = r'require\s*\(\s*["\']([^"\']+)["\']\s*\)'
        for match in re.finditer(require_pattern, content):
            imports.add(match.group(1))
        
        # Dynamic imports: import("x")
        dynamic_pattern = r'import\s*\(\s*["\']([^"\']+)["\']\s*\)'
        for match in re.finditer(dynamic_pattern, content):
            imports.add(match.group(1))
        
        return imports
    
    def _resolve_dependencies(self, source_file: str, imports: Set[str]) -> Set[str]:
        """
        Resolve import statements to actual files in the project.
        
        Args:
            source_file: The file doing the importing
            imports: Set of import module names
        
        Returns:
            Set of resolved file paths in the project
        """
        resolved = set()
        source_dir = Path(source_file).parent
        
        for imp in imports:
            # Try to find matching files in the project
            for file_path in self.file_map.keys():
                file_path_obj = Path(file_path)
                
                # Check if import matches file name or module path
                if self._is_import_match(imp, file_path_obj, source_dir):
                    resolved.add(file_path)
        
        return resolved
    
    def _is_import_match(self, import_name: str, file_path: Path, source_dir: Path) -> bool:
        """Check if an import name matches a file path"""
        # Remove file extension for comparison
        file_stem = file_path.stem
        
        # Direct name match
        if import_name == file_stem:
            return True
        
        # Module path match (e.g., "app.models" matches "app/models.py")
        import_path = import_name.replace('.', '/')
        if str(file_path).replace('\\', '/').startswith(import_path):
            return True
        
        # Relative import match
        if import_name.startswith('.'):
            # Handle relative imports
            relative_parts = import_name.lstrip('.').split('.')
            if relative_parts and relative_parts[0] == file_stem:
                return True
        
        return False
    
    def _calculate_metrics(self):
        """Calculate graph metrics for all nodes"""
        # Calculate in-degree and out-degree
        for file_path in self.file_map.keys():
            self.in_degree[file_path] = len(self.dependents[file_path])
            self.out_degree[file_path] = len(self.dependencies[file_path])
        
        # Calculate centrality (simplified PageRank-like score)
        self._calculate_centrality()
    
    def _calculate_centrality(self):
        """Calculate centrality scores using a simplified PageRank algorithm"""
        # Initialize all nodes with equal centrality
        num_nodes = len(self.file_map)
        if num_nodes == 0:
            return
        
        centrality = {path: 1.0 / num_nodes for path in self.file_map.keys()}
        
        # Iterative calculation (simplified PageRank)
        damping = 0.85
        iterations = 10
        
        for _ in range(iterations):
            new_centrality = {}
            
            for node in self.file_map.keys():
                # Base score
                score = (1 - damping) / num_nodes
                
                # Add contributions from nodes that depend on this one
                for dependent in self.dependents[node]:
                    out_deg = self.out_degree[dependent]
                    if out_deg > 0:
                        score += damping * centrality[dependent] / out_deg
                
                new_centrality[node] = score
            
            centrality = new_centrality
        
        self.centrality = {k: round(v * 100, 2) for k, v in centrality.items()}
    
    def _build_graph_output(self) -> Dict:
        """Build the final graph output structure"""
        # Build nodes with metadata
        nodes = []
        for file_info in self.files:
            node = {
                "id": file_info.path,
                "path": file_info.path,
                "name": file_info.name,
                "language": file_info.language,
                "risk_level": file_info.risk_level,
                "risk_score": file_info.risk_score,
                "line_count": file_info.lines_of_code,
                "import_count": file_info.import_count,
                "function_count": file_info.function_count,
                "class_count": file_info.class_count,
                "in_degree": self.in_degree.get(file_info.path, 0),
                "out_degree": self.out_degree.get(file_info.path, 0),
                "centrality": self.centrality.get(file_info.path, 0),
            }
            nodes.append(node)
        
        # Build edges
        edges = [
            {
                "source": source,
                "target": target,
                "type": "dependency"
            }
            for source, target in self.edges
        ]
        
        # Calculate graph-level metrics
        total_edges = len(self.edges)
        total_nodes = len(nodes)
        density = (total_edges / (total_nodes * (total_nodes - 1))) if total_nodes > 1 else 0
        
        # Identify critical modules (high centrality + high in-degree)
        critical_modules = sorted(
            [
                {
                    "path": node["path"],
                    "centrality": node["centrality"],
                    "in_degree": node["in_degree"],
                    "risk_score": node["risk_score"],
                }
                for node in nodes
            ],
            key=lambda x: (x["centrality"] + x["in_degree"] * 10),
            reverse=True
        )[:10]  # Top 10 critical modules
        
        return {
            "nodes": nodes,
            "edges": edges,
            "metrics": {
                "total_nodes": total_nodes,
                "total_edges": total_edges,
                "density": round(density, 4),
                "avg_in_degree": round(sum(self.in_degree.values()) / total_nodes, 2) if total_nodes > 0 else 0,
                "avg_out_degree": round(sum(self.out_degree.values()) / total_nodes, 2) if total_nodes > 0 else 0,
                "max_in_degree": max(self.in_degree.values()) if self.in_degree else 0,
                "max_out_degree": max(self.out_degree.values()) if self.out_degree else 0,
            },
            "critical_modules": critical_modules,
        }
    
    def calculate_blast_radius(self, changed_file: str) -> Dict:
        """
        Calculate the blast radius for a changed file.
        
        Args:
            changed_file: Path to the file that changed
        
        Returns:
            Blast radius analysis with affected files and recommendations
        """
        if changed_file not in self.file_map:
            return {
                "error": f"File not found: {changed_file}",
                "changed_file": changed_file,
                "directly_affected": [],
                "indirectly_affected": [],
                "total_affected": 0,
                "risk_severity": "unknown",
            }
        
        # Get directly affected files (files that import this one)
        directly_affected = list(self.dependents[changed_file])
        
        # Get indirectly affected files (transitive dependencies)
        indirectly_affected = set()
        visited = set([changed_file])
        queue = list(directly_affected)
        
        while queue:
            current = queue.pop(0)
            if current in visited:
                continue
            
            visited.add(current)
            
            # Add files that depend on current file
            for dependent in self.dependents[current]:
                if dependent not in visited and dependent not in directly_affected:
                    indirectly_affected.add(dependent)
                    queue.append(dependent)
        
        indirectly_affected = list(indirectly_affected)
        
        # Calculate risk severity
        changed_file_info = self.file_map[changed_file]
        total_affected = len(directly_affected) + len(indirectly_affected)
        
        # Risk factors
        risk_factors = []
        
        if changed_file_info.risk_level in ["high", "critical"]:
            risk_factors.append(f"Changed file has {changed_file_info.risk_level} risk level")
        
        if self.in_degree.get(changed_file, 0) > 5:
            risk_factors.append(f"File is heavily depended upon ({self.in_degree[changed_file]} direct dependents)")
        
        if self.centrality.get(changed_file, 0) > 5:
            risk_factors.append(f"File is central to the codebase (centrality: {self.centrality[changed_file]})")
        
        if total_affected > 10:
            risk_factors.append(f"Large blast radius ({total_affected} files affected)")
        
        # Determine severity
        if total_affected == 0:
            severity = "low"
            explanation = "No other files depend on this file. Changes are isolated."
        elif total_affected <= 3:
            severity = "low"
            explanation = f"Small blast radius. {total_affected} file(s) affected."
        elif total_affected <= 10:
            severity = "medium"
            explanation = f"Moderate blast radius. {total_affected} files affected."
        elif total_affected <= 20:
            severity = "high"
            explanation = f"Large blast radius. {total_affected} files affected."
        else:
            severity = "critical"
            explanation = f"Critical blast radius. {total_affected} files affected across the codebase."
        
        # Upgrade severity if file is critical
        if changed_file_info.risk_level == "critical" and severity in ["low", "medium"]:
            severity = "high"
        
        # Generate test recommendations
        test_recommendations = self._generate_test_recommendations(
            changed_file,
            directly_affected,
            indirectly_affected,
            changed_file_info
        )
        
        return {
            "changed_file": changed_file,
            "file_info": {
                "path": changed_file_info.path,
                "language": changed_file_info.language,
                "risk_level": changed_file_info.risk_level,
                "risk_score": changed_file_info.risk_score,
                "in_degree": self.in_degree.get(changed_file, 0),
                "out_degree": self.out_degree.get(changed_file, 0),
                "centrality": self.centrality.get(changed_file, 0),
            },
            "directly_affected": [
                {
                    "path": path,
                    "risk_level": self.file_map[path].risk_level,
                    "language": self.file_map[path].language,
                }
                for path in directly_affected
            ],
            "indirectly_affected": [
                {
                    "path": path,
                    "risk_level": self.file_map[path].risk_level,
                    "language": self.file_map[path].language,
                }
                for path in indirectly_affected
            ],
            "total_affected": total_affected,
            "risk_severity": severity,
            "explanation": explanation,
            "risk_factors": risk_factors,
            "test_recommendations": test_recommendations,
        }
    
    def _generate_test_recommendations(
        self,
        changed_file: str,
        directly_affected: List[str],
        indirectly_affected: List[str],
        file_info: FileInfo
    ) -> List[str]:
        """Generate test recommendations based on blast radius"""
        recommendations = []
        
        # Always test the changed file
        recommendations.append(f"Run unit tests for {changed_file}")
        
        # Test directly affected files
        if directly_affected:
            recommendations.append(f"Run tests for {len(directly_affected)} directly affected file(s)")
            
            # Highlight high-risk affected files
            high_risk_affected = [
                path for path in directly_affected
                if self.file_map[path].risk_level in ["high", "critical"]
            ]
            if high_risk_affected:
                recommendations.append(f"Priority: Test {len(high_risk_affected)} high-risk affected file(s)")
        
        # Integration tests if blast radius is large
        if len(directly_affected) + len(indirectly_affected) > 5:
            recommendations.append("Run integration tests for affected modules")
        
        # Full test suite for critical changes
        if file_info.risk_level == "critical" or len(directly_affected) > 10:
            recommendations.append("Consider running full test suite due to critical impact")
        
        # Regression tests
        if self.centrality.get(changed_file, 0) > 5:
            recommendations.append("Run regression tests - file is central to codebase")
        
        return recommendations


# Made with Bob