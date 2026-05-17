"""
AI Insights and Documentation Engine for CodeAtlas
Provides intelligent analysis and documentation generation with provider abstraction
"""
from typing import Dict, List, Optional, Any, Protocol
from abc import ABC, abstractmethod
from datetime import datetime
import os
from pathlib import Path

from app.models import FileInfo, ScanResult


class AIProvider(Protocol):
    """Protocol for AI provider implementations"""
    
    @abstractmethod
    async def generate_module_insight(
        self,
        file_info: FileInfo,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Generate insights for a specific module/file"""
        ...
    
    @abstractmethod
    async def generate_repo_summary(
        self,
        scan_result: ScanResult,
        graph_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Generate executive summary for entire repository"""
        ...
    
    @abstractmethod
    async def generate_documentation(
        self,
        scan_result: ScanResult,
        doc_type: str,
        graph_data: Optional[Dict[str, Any]] = None
    ) -> str:
        """Generate markdown documentation"""
        ...


class MockAIProvider:
    """
    Mock AI provider with realistic responses.
    Simulates a senior staff engineer reviewing a legacy system.
    """
    
    async def generate_module_insight(
        self,
        file_info: FileInfo,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Generate realistic mock insights for a module"""
        
        # Analyze file characteristics
        is_large = file_info.lines_of_code > 300
        is_complex = file_info.complexity_score > 10
        has_debt = file_info.todo_count + file_info.fixme_count > 3
        is_highly_coupled = file_info.import_count > 15
        
        # Generate purpose summary
        purpose = self._generate_purpose(file_info)
        
        # Generate technical debt explanation
        tech_debt = self._generate_tech_debt(file_info, is_large, is_complex, has_debt)
        
        # Generate modernization recommendations
        modernization = self._generate_modernization(file_info, is_large, is_complex, is_highly_coupled)
        
        # Generate change risks
        risks = self._generate_risks(file_info, is_large, is_complex, is_highly_coupled)
        
        # Generate test suggestions
        tests = self._generate_test_suggestions(file_info)
        
        # Calculate confidence score
        confidence = self._calculate_confidence(file_info)
        
        return {
            "file_path": file_info.path,
            "purpose": purpose,
            "technical_debt": tech_debt,
            "modernization_advice": modernization,
            "change_risks": risks,
            "suggested_tests": tests,
            "confidence_score": confidence,
            "generated_at": datetime.now().isoformat()
        }
    
    def _generate_purpose(self, file_info: FileInfo) -> str:
        """Generate purpose summary based on file characteristics"""
        lang = file_info.language.lower()
        name = file_info.name
        
        if "test" in name.lower():
            return f"Test suite for validating functionality. Contains {file_info.function_count} test cases covering core business logic."
        elif "config" in name.lower() or "settings" in name.lower():
            return f"Configuration module managing application settings and environment-specific parameters."
        elif "model" in name.lower() or "schema" in name.lower():
            return f"Data model definition with {file_info.class_count} classes representing core domain entities."
        elif "util" in name.lower() or "helper" in name.lower():
            return f"Utility module providing {file_info.function_count} helper functions for common operations across the codebase."
        elif "api" in name.lower() or "endpoint" in name.lower():
            return f"API endpoint handler managing HTTP requests and responses. Defines {file_info.function_count} route handlers."
        elif file_info.class_count > 3:
            return f"Core business logic module with {file_info.class_count} classes implementing key domain functionality."
        elif file_info.function_count > 10:
            return f"Functional module with {file_info.function_count} functions handling data processing and transformations."
        else:
            return f"Module implementing specific functionality with {file_info.function_count} functions and {file_info.class_count} classes."
    
    def _generate_tech_debt(self, file_info: FileInfo, is_large: bool, is_complex: bool, has_debt: bool) -> str:
        """Generate technical debt explanation"""
        issues = []
        
        if is_large:
            issues.append(f"File size ({file_info.lines_of_code} LOC) exceeds maintainability threshold. Consider splitting into smaller, focused modules.")
        
        if is_complex:
            issues.append(f"High cyclomatic complexity (score: {file_info.complexity_score:.1f}) indicates nested logic that's difficult to test and maintain.")
        
        if has_debt:
            debt_count = file_info.todo_count + file_info.fixme_count
            issues.append(f"Contains {debt_count} TODO/FIXME markers indicating incomplete implementations or known issues.")
        
        if file_info.import_count > 20:
            issues.append(f"Excessive dependencies ({file_info.import_count} imports) create tight coupling and increase change risk.")
        
        if not issues:
            return "Minimal technical debt detected. Code appears well-structured and maintainable."
        
        return " ".join(issues)
    
    def _generate_modernization(self, file_info: FileInfo, is_large: bool, is_complex: bool, is_highly_coupled: bool) -> str:
        """Generate modernization recommendations"""
        recommendations = []
        
        if is_large:
            recommendations.append("Refactor into smaller modules using Single Responsibility Principle.")
        
        if is_complex:
            recommendations.append("Extract complex logic into well-named helper functions with clear contracts.")
        
        if is_highly_coupled:
            recommendations.append("Introduce dependency injection to reduce coupling and improve testability.")
        
        if file_info.language == "python":
            if file_info.function_count > 0:
                recommendations.append("Add type hints for better IDE support and runtime validation.")
            if file_info.class_count > 0:
                recommendations.append("Consider using dataclasses or Pydantic models for data structures.")
        elif file_info.language == "javascript":
            recommendations.append("Migrate to TypeScript for type safety and better tooling support.")
        
        if not recommendations:
            recommendations.append("Code structure is reasonable. Focus on adding comprehensive tests and documentation.")
        
        return " ".join(recommendations)
    
    def _generate_risks(self, file_info: FileInfo, is_large: bool, is_complex: bool, is_highly_coupled: bool) -> List[str]:
        """Generate list of change risks"""
        risks = []
        
        if file_info.risk_level in ["high", "critical"]:
            risks.append(f"High risk score ({file_info.risk_score:.2f}) indicates changes may have widespread impact")
        
        if is_large:
            risks.append("Large file size increases probability of merge conflicts and regression bugs")
        
        if is_complex:
            risks.append("Complex logic makes it difficult to predict side effects of changes")
        
        if is_highly_coupled:
            risks.append("High coupling means changes may cascade to dependent modules")
        
        if file_info.todo_count > 0:
            risks.append("Incomplete implementations may cause unexpected behavior when modified")
        
        if not risks:
            risks.append("Low risk - changes should be relatively safe with proper testing")
        
        return risks
    
    def _generate_test_suggestions(self, file_info: FileInfo) -> List[str]:
        """Generate test suggestions"""
        suggestions = []
        
        if file_info.function_count > 0:
            suggestions.append(f"Unit tests for all {file_info.function_count} functions with edge cases")
        
        if file_info.class_count > 0:
            suggestions.append(f"Integration tests for {file_info.class_count} classes and their interactions")
        
        if file_info.import_count > 10:
            suggestions.append("Mock external dependencies to isolate unit tests")
        
        if file_info.complexity_score > 10:
            suggestions.append("Property-based tests for complex logic paths")
        
        suggestions.append("Regression tests before and after refactoring")
        
        if file_info.language == "python":
            suggestions.append("Use pytest with coverage reporting (aim for >80%)")
        elif file_info.language in ["javascript", "typescript"]:
            suggestions.append("Use Jest or Vitest with snapshot testing for UI components")
        
        return suggestions
    
    def _calculate_confidence(self, file_info: FileInfo) -> float:
        """Calculate confidence score for the analysis"""
        # Base confidence
        confidence = 0.85
        
        # Adjust based on file characteristics
        if file_info.lines_of_code < 50:
            confidence -= 0.1  # Less data to analyze
        elif file_info.lines_of_code > 500:
            confidence += 0.05  # More patterns to detect
        
        if file_info.function_count + file_info.class_count > 10:
            confidence += 0.05  # More structure to analyze
        
        # Cap between 0.7 and 0.95
        return max(0.7, min(0.95, confidence))
    
    async def generate_repo_summary(
        self,
        scan_result: ScanResult,
        graph_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Generate executive summary for repository"""
        
        metadata = scan_result.metadata
        files = scan_result.files
        
        # Calculate statistics
        high_risk_files = [f for f in files if f.risk_level in ["high", "critical"]]
        avg_risk = sum(f.risk_score for f in files) / len(files) if files else 0
        
        # Identify critical modules
        critical_modules = sorted(
            files,
            key=lambda f: (f.risk_score * (f.import_count + 1)),
            reverse=True
        )[:5]
        
        # Generate architecture overview
        architecture = self._generate_architecture_overview(scan_result, graph_data)
        
        # Generate top risks
        top_risks = self._generate_top_risks(high_risk_files, avg_risk)
        
        # Generate modernization priorities
        priorities = self._generate_modernization_priorities(scan_result)
        
        # Estimate onboarding difficulty
        onboarding = self._estimate_onboarding_difficulty(scan_result)
        
        # Generate recommendations
        recommendations = self._generate_recommendations(scan_result, high_risk_files)
        
        return {
            "repository_name": metadata.name,
            "total_files": metadata.total_files,
            "total_lines": metadata.total_lines,
            "languages": [lang.language for lang in metadata.languages],
            "architecture_overview": architecture,
            "top_risks": top_risks,
            "critical_modules": [
                {
                    "path": m.path,
                    "risk_score": m.risk_score,
                    "reason": f"{m.lines_of_code} LOC, {m.import_count} dependencies"
                }
                for m in critical_modules
            ],
            "modernization_priorities": priorities,
            "onboarding_difficulty": onboarding,
            "recommended_next_steps": recommendations,
            "generated_at": datetime.now().isoformat()
        }
    
    def _generate_architecture_overview(self, scan_result: ScanResult, graph_data: Optional[Dict[str, Any]]) -> str:
        """Generate architecture overview"""
        metadata = scan_result.metadata
        languages = [lang.language for lang in metadata.languages]
        
        primary_lang = languages[0] if languages else "unknown"
        
        overview = f"This is a {primary_lang}-based codebase with {metadata.total_files} files totaling {metadata.total_lines:,} lines of code. "
        
        if len(languages) > 1:
            overview += f"The project uses multiple languages: {', '.join(languages)}. "
        
        if graph_data and "metrics" in graph_data:
            metrics = graph_data["metrics"]
            overview += f"Dependency analysis reveals {metrics.get('total_edges', 0)} connections between modules with a graph density of {metrics.get('density', 0):.2f}. "
        
        # Analyze structure
        has_tests = any("test" in f.path.lower() for f in scan_result.files)
        has_config = any("config" in f.path.lower() for f in scan_result.files)
        
        if has_tests:
            overview += "Test infrastructure is present. "
        else:
            overview += "⚠️ No test files detected - testing infrastructure needs to be established. "
        
        if has_config:
            overview += "Configuration management is in place."
        
        return overview
    
    def _generate_top_risks(self, high_risk_files: List[FileInfo], avg_risk: float) -> List[str]:
        """Generate top risks"""
        risks = []
        
        if len(high_risk_files) > 10:
            risks.append(f"⚠️ {len(high_risk_files)} high-risk files require immediate attention")
        elif len(high_risk_files) > 5:
            risks.append(f"⚠️ {len(high_risk_files)} high-risk files need refactoring")
        
        if avg_risk > 0.7:
            risks.append("⚠️ Overall codebase risk is elevated - systematic refactoring recommended")
        
        # Check for specific patterns
        large_files = [f for f in high_risk_files if f.lines_of_code > 500]
        if large_files:
            risks.append(f"⚠️ {len(large_files)} files exceed 500 LOC - consider modularization")
        
        complex_files = [f for f in high_risk_files if f.complexity_score > 15]
        if complex_files:
            risks.append(f"⚠️ {len(complex_files)} files have high cyclomatic complexity")
        
        if not risks:
            risks.append("✓ No critical risks detected - codebase is in good health")
        
        return risks
    
    def _generate_modernization_priorities(self, scan_result: ScanResult) -> List[str]:
        """Generate modernization priorities"""
        priorities = []
        
        # Check for testing
        test_files = [f for f in scan_result.files if "test" in f.path.lower()]
        if not test_files:
            priorities.append("1. Establish comprehensive test suite (critical for safe refactoring)")
        elif len(test_files) < len(scan_result.files) * 0.2:
            priorities.append("1. Increase test coverage to at least 80%")
        
        # Check for high-risk files
        high_risk = [f for f in scan_result.files if f.risk_level in ["high", "critical"]]
        if high_risk:
            priorities.append(f"2. Refactor {len(high_risk)} high-risk modules to reduce complexity")
        
        # Check for documentation
        has_readme = any("readme" in f.path.lower() for f in scan_result.files)
        if not has_readme:
            priorities.append("3. Create comprehensive documentation (README, architecture docs)")
        
        # Language-specific recommendations
        languages = [lang.language for lang in scan_result.metadata.languages]
        if "javascript" in languages and "typescript" not in languages:
            priorities.append("4. Migrate JavaScript to TypeScript for type safety")
        
        if "python" in languages:
            priorities.append("5. Add type hints and use static analysis tools (mypy, ruff)")
        
        # Add CI/CD if not many test files
        if len(test_files) > 0:
            priorities.append("6. Set up CI/CD pipeline with automated testing")
        
        return priorities[:6]  # Top 6 priorities
    
    def _estimate_onboarding_difficulty(self, scan_result: ScanResult) -> Dict[str, Any]:
        """Estimate onboarding difficulty"""
        
        # Calculate factors
        total_files = scan_result.metadata.total_files
        total_lines = scan_result.metadata.total_lines
        avg_risk = sum(f.risk_score for f in scan_result.files) / len(scan_result.files) if scan_result.files else 0
        
        has_docs = any("readme" in f.path.lower() or "doc" in f.path.lower() for f in scan_result.files)
        has_tests = any("test" in f.path.lower() for f in scan_result.files)
        
        # Calculate difficulty score (0-10)
        difficulty = 5.0
        
        if total_lines > 50000:
            difficulty += 2
        elif total_lines > 20000:
            difficulty += 1
        
        if avg_risk > 0.7:
            difficulty += 1.5
        elif avg_risk > 0.5:
            difficulty += 0.5
        
        if not has_docs:
            difficulty += 1
        
        if not has_tests:
            difficulty += 1
        
        difficulty = min(10, max(1, difficulty))
        
        # Determine level
        if difficulty < 4:
            level = "Easy"
            description = "Well-structured codebase with good documentation. New developers can be productive within days."
        elif difficulty < 7:
            level = "Moderate"
            description = "Requires 1-2 weeks for new developers to understand core architecture and become productive."
        else:
            level = "Challenging"
            description = "Complex codebase requiring 3-4 weeks of onboarding. Pair programming and mentorship strongly recommended."
        
        return {
            "level": level,
            "score": round(difficulty, 1),
            "description": description,
            "estimated_onboarding_time": f"{int(difficulty * 3)} days"
        }
    
    def _generate_recommendations(self, scan_result: ScanResult, high_risk_files: List[FileInfo]) -> List[str]:
        """Generate recommended next steps"""
        recommendations = []
        
        # Immediate actions
        if high_risk_files:
            top_risk = high_risk_files[0]
            recommendations.append(f"🔴 IMMEDIATE: Review and refactor {top_risk.path} (risk score: {top_risk.risk_score:.2f})")
        
        # Testing
        test_files = [f for f in scan_result.files if "test" in f.path.lower()]
        if not test_files:
            recommendations.append("🟡 HIGH PRIORITY: Establish test infrastructure before making changes")
        
        # Documentation
        has_docs = any("readme" in f.path.lower() for f in scan_result.files)
        if not has_docs:
            recommendations.append("🟡 HIGH PRIORITY: Create architecture documentation and onboarding guide")
        
        # Code quality
        recommendations.append("🟢 ONGOING: Set up automated code quality checks (linting, formatting)")
        recommendations.append("🟢 ONGOING: Implement pre-commit hooks for consistency")
        
        # Monitoring
        recommendations.append("🟢 STRATEGIC: Add observability and monitoring to track system health")
        
        return recommendations[:6]
    
    async def generate_documentation(
        self,
        scan_result: ScanResult,
        doc_type: str,
        graph_data: Optional[Dict[str, Any]] = None
    ) -> str:
        """Generate markdown documentation"""
        
        if doc_type == "ARCHITECTURE":
            return self._generate_architecture_doc(scan_result, graph_data)
        elif doc_type == "ONBOARDING":
            return self._generate_onboarding_doc(scan_result)
        elif doc_type == "RISK_REPORT":
            return self._generate_risk_report(scan_result)
        elif doc_type == "MODERNIZATION_PLAN":
            return self._generate_modernization_plan(scan_result)
        else:
            raise ValueError(f"Unknown documentation type: {doc_type}")
    
    def _generate_architecture_doc(self, scan_result: ScanResult, graph_data: Optional[Dict[str, Any]]) -> str:
        """Generate ARCHITECTURE.md"""
        metadata = scan_result.metadata
        languages = [lang.language for lang in metadata.languages]
        
        doc = f"""# Architecture Documentation

**Generated:** {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}  
**Repository:** {metadata.name}  
**Total Files:** {metadata.total_files}  
**Total Lines:** {metadata.total_lines:,}

## Overview

This codebase is built primarily with **{languages[0] if languages else 'unknown'}** and consists of {metadata.total_files} files totaling {metadata.total_lines:,} lines of code.

### Technology Stack

"""
        
        for lang_summary in metadata.languages:
            doc += f"- **{lang_summary.language}**: {lang_summary.file_count} files, {lang_summary.total_lines:,} lines\n"
        
        doc += "\n## Module Structure\n\n"
        
        # Group files by directory
        folders = {}
        for file in scan_result.files:
            folder = str(Path(file.path).parent)
            if folder not in folders:
                folders[folder] = []
            folders[folder].append(file)
        
        for folder, files in sorted(folders.items())[:10]:  # Top 10 folders
            doc += f"### `{folder}/`\n\n"
            doc += f"- **Files:** {len(files)}\n"
            doc += f"- **Total Lines:** {sum(f.lines_of_code for f in files):,}\n"
            doc += f"- **Average Risk:** {sum(f.risk_score for f in files) / len(files):.2f}\n\n"
        
        if graph_data and "metrics" in graph_data:
            metrics = graph_data["metrics"]
            doc += f"""## Dependency Metrics

- **Total Modules:** {metrics.get('total_nodes', 0)}
- **Dependencies:** {metrics.get('total_edges', 0)}
- **Graph Density:** {metrics.get('density', 0):.3f}
- **Avg In-Degree:** {metrics.get('avg_in_degree', 0):.1f}
- **Avg Out-Degree:** {metrics.get('avg_out_degree', 0):.1f}

"""
        
        doc += """## Key Design Patterns

*This section should be filled in by the development team based on actual patterns used.*

## External Dependencies

*Document third-party libraries and services here.*

## Data Flow

*Describe how data flows through the system.*

## Security Considerations

*Document authentication, authorization, and security measures.*

---
*Generated by CodeAtlas AI*
"""
        
        return doc
    
    def _generate_onboarding_doc(self, scan_result: ScanResult) -> str:
        """Generate ONBOARDING.md"""
        metadata = scan_result.metadata
        
        doc = f"""# Developer Onboarding Guide

**Generated:** {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}  
**Repository:** {metadata.name}

## Welcome! 👋

This guide will help you get up to speed with the codebase.

## Prerequisites

"""
        
        languages = [lang.language for lang in metadata.languages]
        for lang in languages:
            if lang == "python":
                doc += "- Python 3.8+ installed\n"
                doc += "- pip or poetry for package management\n"
            elif lang in ["javascript", "typescript"]:
                doc += "- Node.js 16+ installed\n"
                doc += "- npm or yarn for package management\n"
            elif lang == "java":
                doc += "- JDK 11+ installed\n"
                doc += "- Maven or Gradle\n"
        
        doc += """
## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd """ + metadata.name + """
```

### 2. Install Dependencies

"""
        
        if "python" in languages:
            doc += """```bash
pip install -r requirements.txt
# or
poetry install
```

"""
        
        if "javascript" in languages or "typescript" in languages:
            doc += """```bash
npm install
# or
yarn install
```

"""
        
        doc += """### 3. Run Tests

*Add test commands here*

### 4. Start Development Server

*Add development server commands here*

## Codebase Structure

"""
        
        # List key directories
        folders = {}
        for file in scan_result.files:
            folder = str(Path(file.path).parent)
            if folder not in folders:
                folders[folder] = []
            folders[folder].append(file)
        
        for folder in sorted(folders.keys())[:8]:
            doc += f"- `{folder}/` - *Add description*\n"
        
        doc += """
## Key Modules to Understand

"""
        
        # List important files
        important_files = sorted(scan_result.files, key=lambda f: f.risk_score * f.import_count, reverse=True)[:5]
        for file in important_files:
            doc += f"1. **{file.path}** - {file.lines_of_code} LOC, {file.import_count} dependencies\n"
        
        doc += """
## Development Workflow

1. Create a feature branch
2. Make your changes
3. Write/update tests
4. Run tests locally
5. Submit pull request
6. Code review
7. Merge to main

## Common Tasks

### Running Tests

*Add test commands*

### Building for Production

*Add build commands*

### Debugging

*Add debugging tips*

## Getting Help

- Check existing documentation
- Ask in team chat
- Pair with a senior developer
- Review similar code in the codebase

## Resources

- Architecture documentation: `ARCHITECTURE.md`
- Risk report: `RISK_REPORT.md`
- Modernization plan: `MODERNIZATION_PLAN.md`

---
*Generated by CodeAtlas AI*
"""
        
        return doc
    
    def _generate_risk_report(self, scan_result: ScanResult) -> str:
        """Generate RISK_REPORT.md"""
        high_risk_files = [f for f in scan_result.files if f.risk_level in ["high", "critical"]]
        medium_risk_files = [f for f in scan_result.files if f.risk_level == "medium"]
        
        doc = f"""# Risk Assessment Report

**Generated:** {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}  
**Repository:** {scan_result.metadata.name}

## Executive Summary

- **Total Files Analyzed:** {scan_result.metadata.total_files}
- **High/Critical Risk Files:** {len(high_risk_files)}
- **Medium Risk Files:** {len(medium_risk_files)}
- **Overall Risk Level:** {"🔴 HIGH" if len(high_risk_files) > 10 else "🟡 MODERATE" if len(high_risk_files) > 5 else "🟢 LOW"}

## Critical Risk Files

"""
        
        for file in sorted(high_risk_files, key=lambda f: f.risk_score, reverse=True)[:10]:
            doc += f"""### {file.path}

- **Risk Score:** {file.risk_score:.2f} ({file.risk_level.upper()})
- **Lines of Code:** {file.lines_of_code}
- **Complexity:** {file.complexity_score:.1f}
- **Dependencies:** {file.import_count}
- **Technical Debt:** {file.todo_count + file.fixme_count} TODO/FIXME markers

**Recommendations:**
- Refactor into smaller modules
- Add comprehensive unit tests
- Document complex logic
- Reduce coupling with other modules

---

"""
        
        doc += """## Risk Factors

### Code Complexity

"""
        
        complex_files = [f for f in scan_result.files if f.complexity_score > 10]
        doc += f"- {len(complex_files)} files have high cyclomatic complexity\n"
        doc += "- Recommendation: Simplify control flow and extract helper functions\n\n"
        
        doc += """### File Size

"""
        
        large_files = [f for f in scan_result.files if f.lines_of_code > 300]
        doc += f"- {len(large_files)} files exceed 300 lines\n"
        doc += "- Recommendation: Split large files following Single Responsibility Principle\n\n"
        
        doc += """### Technical Debt

"""
        
        debt_files = [f for f in scan_result.files if f.todo_count + f.fixme_count > 0]
        total_debt = sum(f.todo_count + f.fixme_count for f in scan_result.files)
        doc += f"- {total_debt} TODO/FIXME markers across {len(debt_files)} files\n"
        doc += "- Recommendation: Create tickets for each TODO and prioritize resolution\n\n"
        
        doc += """## Mitigation Strategy

### Phase 1: Immediate Actions (Week 1-2)

1. Add tests for critical high-risk modules
2. Document complex logic in top 5 risk files
3. Set up automated code quality checks

### Phase 2: Short-term (Month 1-2)

1. Refactor top 10 high-risk files
2. Reduce complexity in modules with score > 15
3. Resolve critical TODO/FIXME items

### Phase 3: Long-term (Quarter 1-2)

1. Systematic refactoring of all high-risk modules
2. Establish coding standards and review process
3. Implement continuous monitoring of code quality

## Monitoring

Track these metrics monthly:
- Number of high-risk files
- Average complexity score
- Test coverage percentage
- Technical debt markers

---
*Generated by CodeAtlas AI*
"""
        
        return doc
    
    def _generate_modernization_plan(self, scan_result: ScanResult) -> str:
        """Generate MODERNIZATION_PLAN.md"""
        metadata = scan_result.metadata
        languages = [lang.language for lang in metadata.languages]
        
        doc = f"""# Modernization Plan

**Generated:** {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}  
**Repository:** {metadata.name}

## Current State Assessment

- **Total Files:** {metadata.total_files}
- **Total Lines:** {metadata.total_lines:,}
- **Primary Language:** {languages[0] if languages else 'unknown'}
- **Test Coverage:** {"Unknown - needs assessment" if not any("test" in f.path.lower() for f in scan_result.files) else "Present but needs measurement"}

## Modernization Goals

1. **Improve Code Quality**
   - Reduce high-risk modules by 50%
   - Achieve 80%+ test coverage
   - Eliminate critical technical debt

2. **Enhance Maintainability**
   - Modularize large files (>300 LOC)
   - Reduce cyclomatic complexity
   - Improve documentation

3. **Adopt Modern Practices**
   - Implement CI/CD pipeline
   - Add automated testing
   - Set up code quality gates

## Phased Approach

### Phase 1: Foundation (Months 1-2)

**Objective:** Establish safety net and baseline

**Tasks:**
"""
        
        test_files = [f for f in scan_result.files if "test" in f.path.lower()]
        if not test_files:
            doc += "- [ ] Create test infrastructure\n"
            doc += "- [ ] Write tests for critical modules\n"
        else:
            doc += "- [ ] Measure current test coverage\n"
            doc += "- [ ] Increase coverage to 60%\n"
        
        doc += """- [ ] Set up CI/CD pipeline
- [ ] Configure linting and formatting
- [ ] Document architecture

**Success Criteria:**
- All critical modules have tests
- CI/CD pipeline running
- Architecture documented

### Phase 2: Refactoring (Months 3-4)

**Objective:** Reduce technical debt and risk

**Tasks:**
"""
        
        high_risk_files = [f for f in scan_result.files if f.risk_level in ["high", "critical"]]
        doc += f"- [ ] Refactor {min(len(high_risk_files), 10)} highest-risk modules\n"
        
        doc += """- [ ] Split large files into smaller modules
- [ ] Reduce complexity in complex functions
- [ ] Resolve TODO/FIXME items

**Success Criteria:**
- 50% reduction in high-risk files
- No files over 500 LOC
- Complexity scores under 15

### Phase 3: Modernization (Months 5-6)

**Objective:** Adopt modern patterns and practices

**Tasks:**
"""
        
        if "javascript" in languages and "typescript" not in languages:
            doc += "- [ ] Migrate JavaScript to TypeScript\n"
        
        if "python" in languages:
            doc += "- [ ] Add type hints to Python code\n"
            doc += "- [ ] Implement static type checking\n"
        
        doc += """- [ ] Introduce dependency injection
- [ ] Implement design patterns where appropriate
- [ ] Add observability and monitoring

**Success Criteria:**
- Modern language features adopted
- Design patterns documented
- Monitoring in place

### Phase 4: Optimization (Ongoing)

**Objective:** Continuous improvement

**Tasks:**
- [ ] Regular code reviews
- [ ] Performance optimization
- [ ] Security audits
- [ ] Documentation updates

## Resource Requirements

### Team
- 2-3 developers (50% time allocation)
- 1 tech lead (25% time allocation)
- QA support for testing

### Tools
- CI/CD platform (GitHub Actions, GitLab CI, etc.)
- Code quality tools (SonarQube, CodeClimate, etc.)
- Testing frameworks
- Documentation platform

### Timeline
- **Total Duration:** 6 months
- **Effort:** ~1000 developer hours
- **Budget:** Estimate based on team rates

## Risk Mitigation

### Technical Risks
- **Risk:** Breaking existing functionality
  - **Mitigation:** Comprehensive test suite before refactoring

- **Risk:** Scope creep
  - **Mitigation:** Strict phase boundaries and success criteria

### Organizational Risks
- **Risk:** Lack of buy-in
  - **Mitigation:** Regular demos and metrics reporting

- **Risk:** Resource constraints
  - **Mitigation:** Phased approach allows for flexibility

## Success Metrics

Track monthly:
- Number of high-risk files
- Test coverage percentage
- Average complexity score
- Technical debt markers
- Build/deployment time
- Bug count in production

## Next Steps

1. Review and approve this plan
2. Allocate resources
3. Set up project tracking
4. Begin Phase 1 tasks
5. Schedule monthly reviews

---
*Generated by CodeAtlas AI*
"""
        
        return doc


class WatsonXAIProvider:
    """
    WatsonX.ai provider implementation.
    Ready for integration when credentials are available.
    """
    
    def __init__(self):
        self.api_key = os.getenv("WATSONX_API_KEY")
        self.project_id = os.getenv("WATSONX_PROJECT_ID")
        self.url = os.getenv("WATSONX_URL")
        self.model_id = os.getenv("WATSONX_MODEL_ID", "ibm/granite-13b-chat-v2")
        
        if not all([self.api_key, self.project_id, self.url]):
            raise ValueError(
                "WatsonX.ai credentials not configured. "
                "Set WATSONX_API_KEY, WATSONX_PROJECT_ID, and WATSONX_URL environment variables."
            )
    
    async def generate_module_insight(
        self,
        file_info: FileInfo,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Generate insights using WatsonX.ai"""
        # TODO: Implement WatsonX.ai API call
        # This is a placeholder for future implementation
        raise NotImplementedError("WatsonX.ai integration pending")
    
    async def generate_repo_summary(
        self,
        scan_result: ScanResult,
        graph_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Generate repository summary using WatsonX.ai"""
        # TODO: Implement WatsonX.ai API call
        raise NotImplementedError("WatsonX.ai integration pending")
    
    async def generate_documentation(
        self,
        scan_result: ScanResult,
        doc_type: str,
        graph_data: Optional[Dict[str, Any]] = None
    ) -> str:
        """Generate documentation using WatsonX.ai"""
        # TODO: Implement WatsonX.ai API call
        raise NotImplementedError("WatsonX.ai integration pending")


class AIInsightEngine:
    """
    Main AI insight engine with provider abstraction.
    Automatically selects provider based on configuration.
    """
    
    def __init__(self):
        self.provider = self._initialize_provider()
    
    def _initialize_provider(self) -> AIProvider:
        """Initialize AI provider based on environment configuration"""
        # Check if WatsonX.ai credentials are available
        if all([
            os.getenv("WATSONX_API_KEY"),
            os.getenv("WATSONX_PROJECT_ID"),
            os.getenv("WATSONX_URL")
        ]):
            try:
                return WatsonXAIProvider()
            except Exception as e:
                print(f"Failed to initialize WatsonX.ai provider: {e}")
                print("Falling back to mock provider")
        
        # Default to mock provider
        return MockAIProvider()
    
    async def generate_module_insight(
        self,
        file_info: FileInfo,
        context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Generate insights for a module"""
        return await self.provider.generate_module_insight(file_info, context)
    
    async def generate_repo_summary(
        self,
        scan_result: ScanResult,
        graph_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Generate repository summary"""
        return await self.provider.generate_repo_summary(scan_result, graph_data)
    
    async def generate_documentation(
        self,
        scan_result: ScanResult,
        doc_type: str,
        graph_data: Optional[Dict[str, Any]] = None
    ) -> str:
        """Generate documentation"""
        return await self.provider.generate_documentation(scan_result, doc_type, graph_data)


# Made with Bob