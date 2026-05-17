"""
CodeAtlas Centralized Metrics Engine
A robust, repository-agnostic scoring system for any codebase.
"""
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
import math
import statistics


@dataclass
class MetricsResult:
    """Standardized metrics result container"""
    # Core metrics
    total_files: int
    total_loc: int
    total_languages: int
    total_nodes: int
    total_edges: int
    resolved_edges: int
    unresolved_imports: int
    dependency_confidence: float  # 0-1
    
    # Risk distribution (percentages)
    critical_risk_pct: int
    high_risk_pct: int
    medium_risk_pct: int
    low_risk_pct: int
    
    # Module counts (actual numbers)
    critical_modules: int
    high_risk_modules: int
    medium_risk_modules: int
    low_risk_modules: int
    
    # Scoring (0-100)
    maintainability_score: int
    architecture_health: int
    modernization_readiness: int
    
    # Estimates
    technical_debt_estimate: int  # in thousands
    refactoring_effort: int  # weeks
    velocity_loss: int  # percentage
    bug_fix_overhead: int  # hours per week
    
    # Risk metrics
    risk_concentration: float  # 0-1 how concentrated risk is
    blast_radius_concentration: float  # 0-1
    centrality_concentration: float  # 0-1
    
    # Validation flags
    validation_warnings: List[str]
    
    # Before/After
    before_modernization: Dict[str, Any]
    after_modernization: Dict[str, Any]


def safe_number(value: Any, fallback: float = 0.0) -> float:
    """Safely convert value to number"""
    if value is None:
        return fallback
    try:
        num = float(value)
        if math.isnan(num) or math.isinf(num):
            return fallback
        return num
    except (ValueError, TypeError):
        return fallback


def safe_int(value: Any, fallback: int = 0) -> int:
    """Safely convert to integer"""
    return int(safe_number(value, fallback))


def clamp(value: float, min_val: float, max_val: float) -> float:
    """Clamp value between min and max"""
    return max(min_val, min(max_val, value))


def percentile(values: List[float], p: float) -> float:
    """Calculate percentile of values"""
    if not values:
        return 0
    sorted_vals = sorted(values)
    idx = (len(sorted_vals) - 1) * (p / 100)
    lower = int(math.floor(idx))
    upper = int(math.ceil(idx))
    if lower == upper:
        return sorted_vals[lower]
    return sorted_vals[lower] + (sorted_vals[upper] - sorted_vals[lower]) * (idx - lower)


def normalize_risk_score(score: float) -> int:
    """Normalize risk score to 0-100"""
    raw = safe_number(score, 0)
    # Handle different scales
    if raw > 1:
        raw = raw / 100  # Convert from 0-100 scale
    return int(clamp(raw * 100, 0, 100))


def get_risk_level(score: float) -> str:
    """Get risk level from score"""
    normalized = normalize_risk_score(score)
    if normalized >= 80:
        return "critical"
    elif normalized >= 60:
        return "high"
    elif normalized >= 40:
        return "medium"
    return "low"


def calculate_percentile_based_risk(node: Dict[str, Any], percentiles: Dict[str, float]) -> float:
    """
    Calculate risk based on percentiles relative to repository.
    This normalizes against the repository's distribution, not fixed thresholds.
    """
    # LOC percentile position
    loc = safe_number(node.get("line_count", 0), 0)
    loc_pct = 0
    if percentiles.get("p75", 0) > 0:
        loc_pct = min(1.0, loc / percentiles["p75"])
    
    # Import count percentile
    imports = safe_number(node.get("import_count") or node.get("in_degree", 0), 0)
    imp_pct = 0
    max_imports = percentiles.get("max_imports", 1)
    if max_imports > 0:
        imp_pct = min(1.0, imports / max_imports)
    
    # Function count percentile
    functions = safe_number(node.get("function_count", 0), 0)
    func_pct = 0
    max_funcs = percentiles.get("max_functions", 1)
    if max_funcs > 0:
        func_pct = min(1.0, functions / max_funcs)
    
    # Base risk from raw score (if available and reasonable)
    raw_risk = safe_number(node.get("risk_score", 0.5), 0.5)
    if raw_risk > 1:
        raw_risk = raw_risk / 100  # Normalize from 0-100
    
    # Weighted combination: 60% raw, 40% percentile-based
    percentile_risk = (loc_pct * 0.4 + imp_pct * 0.3 + func_pct * 0.3)
    
    # Blend raw and percentile-based
    final_risk = (raw_risk * 0.6 + percentile_risk * 0.4)
    
    return clamp(final_risk, 0, 1)


def calculate_repository_percentiles(nodes: List[Dict[str, Any]]) -> Dict[str, float]:
    """Calculate repository distribution percentiles"""
    if not nodes:
        return {"p25": 0, "p50": 0, "p75": 0, "p90": 0, "max": 0, "max_imports": 0, "max_functions": 0}
    
    locs = [safe_number(n.get("line_count", 0), 0) for n in nodes]
    imports = [safe_number(n.get("import_count") or n.get("in_degree", 0), 0) for n in nodes]
    functions = [safe_number(n.get("function_count", 0), 0) for n in nodes]
    
    return {
        "p25": percentile(locs, 25),
        "p50": percentile(locs, 50),
        "p75": percentile(locs, 75),
        "p90": percentile(locs, 90),
        "max": max(locs) if locs else 0,
        "max_imports": max(imports) if imports else 0,
        "max_functions": max(functions) if functions else 0,
    }


def calculate_complexity_score(node: Dict[str, Any]) -> float:
    """Calculate complexity score for a node"""
    loc = safe_number(node.get("line_count", 0), 0)
    functions = safe_number(node.get("function_count", 0), 0)
    classes = safe_number(node.get("class_count", 0), 0)
    imports = safe_number(node.get("import_count") or node.get("out_degree", 0), 0)
    nesting = safe_number(node.get("complexity_score", 0), 0)
    
    # Weighted complexity
    complexity = (
        (loc / 100) * 0.2 +
        functions * 0.2 +
        classes * 0.15 +
        imports * 0.25 +
        nesting * 0.2
    )
    
    return clamp(complexity, 0, 20)


def calculate_maintainability(
    risk_distribution: Dict[str, int],
    avg_complexity: float,
    total_loc: int,
    repo_size: str
) -> int:
    """Calculate maintainability score (0-100)"""
    total = sum(risk_distribution.values()) or 1
    
    # Risk ratio - higher critical/high ratio = lower maintainability
    critical_ratio = risk_distribution.get("critical", 0) / total
    high_ratio = risk_distribution.get("high", 0) / total
    medium_ratio = risk_distribution.get("medium", 0) / total
    
    # Base score from risk (inverse - more risk = lower maintainability)
    risk_penalty = (critical_ratio * 50 + high_ratio * 25 + medium_ratio * 10)
    
    # Complexity penalty (0-20 range mapped to 0-30)
    complexity_penalty = min(30, avg_complexity * 1.5)
    
    # LOC-based smoothing - larger repos have more room for issues
    loc_factor = 1.0
    if repo_size == "large":
        loc_factor = 0.9  # Slightly lower expectation
    elif repo_size == "tiny":
        loc_factor = 1.1  # Higher expectation for small repos
    
    # Calculate base
    base = 85 * loc_factor
    maintainability = base - risk_penalty - complexity_penalty
    
    # Floor based on repo size (tiny repos shouldn't drop to 0)
    floor = 15 if repo_size == "tiny" else (10 if repo_size == "small" else 5)
    
    return int(clamp(round(maintainability), floor, 100))


def calculate_architecture_health(
    graph_density: float,
    centrality_concentration: float,
    blast_radius_concentration: float,
    unresolved_ratio: float,
    total_loc: int,
    dependency_confidence: float = 1.0
) -> int:
    """Calculate architecture health (35-85 range unless truly catastrophic)
    
    If dependency detection is poor (low confidence), we don't penalize as heavily.
    Instead, we assume the low confidence indicates incomplete detection.
    """
    # Graph density (0-1, higher is more connected but could be too coupled)
    density_score = 0
    if graph_density > 0.3:
        density_score = 40  # Too coupled
    elif graph_density > 0.1:
        density_score = 70  # Healthy
    else:
        density_score = 60  # Could be under-connected (not catastrophic)
    
    # Centrality concentration (0-1, higher = more single points of failure)
    centrality_penalty = centrality_concentration * 25
    
    # Blast radius concentration
    blast_penalty = blast_radius_concentration * 15
    
    # Unresolved imports penalty - reduced if dependency confidence is low
    # Low confidence means we don't have full picture, so reduce penalty
    confidence_factor = max(0.3, dependency_confidence)  # Never reduce below 30%
    unresolved_penalty = unresolved_ratio * 15 * confidence_factor
    
    # Base health
    health = density_score - centrality_penalty - blast_penalty - unresolved_penalty
    
    # Ensure minimum health of 35 unless truly catastrophic (all metrics bad)
    min_health = 35
    if health < min_health:
        # Check if truly catastrophic - high centrality AND high blast AND very low confidence
        if centrality_concentration > 0.8 and blast_radius_concentration > 0.8 and dependency_confidence < 0.3:
            return int(clamp(round(health), 0, 100))  # Allow lower
        return min_health
    
    return int(clamp(round(health), 35, 85))


def calculate_modernization_readiness(
    architecture_health: int,
    maintainability: int,
    total_loc: int,
    has_tests: bool
) -> int:
    """Calculate modernization readiness (5-95%)"""
    # Weighted average of health and maintainability
    base_readiness = (architecture_health * 0.5 + maintainability * 0.5)
    
    # Test coverage bonus/penalty
    test_bonus = 10 if has_tests else -10
    
    # LOC factor - very large repos harder to modernize
    loc_factor = 0
    if total_loc > 100000:
        loc_factor = -15
    elif total_loc > 50000:
        loc_factor = -10
    elif total_loc > 10000:
        loc_factor = -5
    
    readiness = base_readiness + test_bonus + loc_factor
    
    # Ensure bounds
    return int(clamp(round(readiness), 5, 95))


def calculate_technical_debt(
    total_loc: int,
    critical_modules: int,
    high_risk_modules: int,
    complexity: float,
    has_tests: bool,
    repo_size: str
) -> int:
    """Calculate technical debt estimate in thousands"""
    # Base debt from LOC
    loc_factor = math.log10(max(total_loc, 1000))  # Log scale
    
    # Risk multiplier
    risk_factor = 1 + (critical_modules * 0.15) + (high_risk_modules * 0.05)
    
    # Complexity factor
    complexity_factor = 1 + (complexity / 20)
    
    # Test penalty
    test_factor = 1.5 if not has_tests else 1.0
    
    # Calculate base
    base_debt = loc_factor * risk_factor * complexity_factor * test_factor * 10
    
    # Scale by repo size
    scale = {
        "tiny": 0.3,
        "small": 0.6,
        "medium": 1.0,
        "large": 1.5,
        "very_large": 2.0
    }
    
    debt = base_debt * scale.get(repo_size, 1.0)
    
    # Ensure minimum and cap
    min_debt = {"tiny": 1, "small": 10, "medium": 25, "large": 100, "very_large": 200}
    min_val = min_debt.get(repo_size, 1)
    
    return int(clamp(round(debt), min_val, 1000))


def calculate_refactoring_effort(
    critical_modules: int,
    high_risk_modules: int,
    medium_risk_modules: int,
    repo_size: str
) -> int:
    """Calculate refactoring effort in weeks"""
    # Weighted by risk
    effort = (
        critical_modules * 2.5 +
        high_risk_modules * 1.0 +
        medium_risk_modules * 0.5
    )
    
    # Scale by repo size
    scale = {
        "tiny": 0.3,
        "small": 0.5,
        "medium": 1.0,
        "large": 1.5,
        "very_large": 2.0
    }
    
    scaled_effort = effort * scale.get(repo_size, 1.0)
    
    # Cap based on repo size
    caps = {"tiny": 4, "small": 8, "medium": 24, "large": 40, "very_large": 52}
    cap = caps.get(repo_size, 52)
    
    return int(clamp(round(scaled_effort), 1, cap))


def calculate_velocity_loss(
    critical_modules: int,
    high_risk_modules: int,
    total_modules: int,
    avg_complexity: float
) -> int:
    """Calculate velocity loss percentage (0-75)"""
    if total_modules == 0:
        return 10
    
    # Risk concentration factor
    risk_concentration = (critical_modules + high_risk_modules) / total_modules
    
    # Base loss from risk concentration
    base_loss = risk_concentration * 50
    
    # Complexity contribution
    complexity_loss = min(20, avg_complexity)
    
    loss = base_loss + complexity_loss
    
    return int(clamp(round(loss), 10, 75))


def calculate_bug_fix_overhead(
    critical_modules: int,
    high_risk_modules: int,
    medium_risk_modules: int,
    has_tests: bool,
    repo_size: str
) -> int:
    """Calculate bug fix overhead in hours/week"""
    # Base from risk modules
    base = critical_modules * 6 + high_risk_modules * 2 + medium_risk_modules * 0.5
    
    # Test penalty
    if not has_tests:
        base *= 1.5
    
    # Scale by repo size
    scale = {"tiny": 0.3, "small": 0.5, "medium": 1.0, "large": 1.5, "very_large": 2.0}
    
    overhead = base * scale.get(repo_size, 1.0)
    
    return int(clamp(round(overhead), 5, 60))


def calculate_concentration(values: List[float]) -> float:
    """Calculate concentration (Gini-like coefficient)"""
    if not values:
        return 0
    n = len(values)
    if n == 1:
        return 0
    
    sorted_vals = sorted(values)
    cumsum = [sum(sorted_vals[:i+1]) for i in range(n)]
    total = sum(sorted_vals)
    
    if total == 0:
        return 0
    
    # Calculate Gini coefficient
    gini = (2 * sum((i + 1) * sorted_vals[i] for i in range(n))) / (n * total) - (n + 1) / n
    
    return clamp(gini, 0, 1)


def detect_has_tests(nodes: List[Dict[str, Any]]) -> bool:
    """Detect if repository has tests"""
    test_indicators = ["test", "spec", "__tests__", "tests", "specs"]
    
    for node in nodes:
        path = (node.get("path") or node.get("name") or "").lower()
        if any(indicator in path for indicator in test_indicators):
            return True
    
    return False


def calculate_before_after(
    maintainability: int,
    technical_debt: int,
    critical_modules: int,
    complexity: float
) -> Tuple[Dict[str, Any], Dict[str, Any]]:
    """Calculate before/after modernization values"""
    
    # After values (post-modernization)
    after_maintainability = clamp(maintainability + 25, 60, 95)
    after_debt = max(1, int(technical_debt * 0.35))
    after_critical = max(0, int(critical_modules * 0.25))
    after_complexity = max(2, round(complexity * 0.5))
    
    before = {
        "maintainability": maintainability,
        "technical_debt": technical_debt,
        "critical_modules": critical_modules,
        "complexity": round(complexity, 1),
        "deployment_time": "30-45 min",
        "onboarding_time": "3-4 weeks"
    }
    
    after = {
        "maintainability": after_maintainability,
        "technical_debt": after_debt,
        "critical_modules": after_critical,
        "complexity": after_complexity,
        "deployment_time": "8-10 min",
        "onboarding_time": "1-2 weeks"
    }
    
    return before, after


def get_repo_size(total_loc: int, total_files: int) -> str:
    """Determine repository size category"""
    if total_loc < 1000 or total_files < 10:
        return "tiny"
    elif total_loc < 10000 or total_files < 50:
        return "small"
    elif total_loc < 50000 or total_files < 200:
        return "medium"
    elif total_loc < 200000 or total_files < 500:
        return "large"
    return "very_large"


def validate_metrics(result: MetricsResult) -> List[str]:
    """Validate metrics and return warnings"""
    warnings = []
    
    # Check for NaN/Infinity
    if result.total_loc == 0 and result.total_files > 0:
        warnings.append("Total LOC is 0 despite files present - data may be incomplete")
    
    if result.dependency_confidence < 0.5:
        warnings.append(f"Dependency confidence low ({result.dependency_confidence:.0%}) - many imports unresolved")
    
    if result.unresolved_imports > result.total_edges * 0.5:
        warnings.append("High ratio of unresolved imports detected")
    
    if result.maintainability_score == 0:
        warnings.append("Maintainability score is 0 - this indicates a critical state")
    
    # Check consistency
    total_risk = (result.critical_modules + result.high_risk_modules + 
                  result.medium_risk_modules + result.low_risk_modules)
    if total_risk != result.total_nodes and result.total_nodes > 0:
        warnings.append(f"Risk module counts ({total_risk}) don't match total nodes ({result.total_nodes})")
    
    return warnings


def calculate_metrics(graph_data: Dict[str, Any]) -> MetricsResult:
    """
    Main entry point - calculate all metrics from graph data.
    This is the single source of truth for all metrics.
    """
    
    # Extract data safely
    nodes = graph_data.get("nodes", []) or []
    edges = graph_data.get("edges", []) or []
    metrics = graph_data.get("metrics", {}) or {}
    
    total_files = len(nodes)
    total_nodes = total_files
    total_edges = len(edges)
    
    # Calculate total LOC (with validation)
    total_loc = sum(safe_int(n.get("line_count"), 0) for n in nodes)
    
    # Calculate percentiles
    percentiles = calculate_repository_percentiles(nodes)
    
    # Calculate normalized risk for each node
    risk_distribution = {"critical": 0, "high": 0, "medium": 0, "low": 0}
    node_risks = []
    
    for node in nodes:
        # Use percentile-based risk calculation
        risk = calculate_percentile_based_risk(node, percentiles)
        risk_normalized = int(risk * 100)
        node_risks.append(risk_normalized)
        
        level = get_risk_level(risk_normalized)
        risk_distribution[level] += 1
    
    # Calculate total languages
    languages = set()
    for node in nodes:
        lang = node.get("language", "unknown")
        if lang:
            languages.add(lang)
    total_languages = len(languages)
    
    # Repository size
    repo_size = get_repo_size(total_loc, total_files)
    
    # Calculate average complexity
    complexities = [calculate_complexity_score(n) for n in nodes]
    avg_complexity = statistics.mean(complexities) if complexities else 0
    
    # Dependency analysis
    resolved_edges = total_edges  # Assuming edges are resolved imports
    # Estimate unresolved (based on nodes with high import count but no corresponding edges)
    import_counts = [safe_int(n.get("import_count") or n.get("out_degree", 0), 0) for n in nodes]
    estimated_imports = sum(import_counts)
    unresolved_imports = max(0, estimated_imports - resolved_edges)
    
    # Dependency confidence
    if estimated_imports > 0:
        dependency_confidence = min(1.0, resolved_edges / max(1, estimated_imports))
    else:
        dependency_confidence = 1.0
    
    # Calculate concentrations
    centrality_values = [safe_number(n.get("centrality", 0), 0) for n in nodes]
    blast_values = [safe_int(n.get("in_degree", 0), 0) for n in nodes]
    
    centrality_concentration = calculate_concentration(centrality_values)
    blast_radius_concentration = calculate_concentration(blast_values)
    
    # Graph density
    max_possible_edges = total_nodes * (total_nodes - 1) // 2
    graph_density = total_edges / max_possible_edges if max_possible_edges > 0 else 0
    
    # Risk distribution percentages
    total = total_nodes or 1
    critical_risk_pct = int((risk_distribution["critical"] / total) * 100)
    high_risk_pct = int((risk_distribution["high"] / total) * 100)
    medium_risk_pct = int((risk_distribution["medium"] / total) * 100)
    low_risk_pct = int((risk_distribution["low"] / total) * 100)
    
    # Normalize percentages to sum to 100
    total_pct = critical_risk_pct + high_risk_pct + medium_risk_pct + low_risk_pct
    if total_pct > 0 and total_pct != 100:
        factor = 100 / total_pct
        critical_risk_pct = int(critical_risk_pct * factor)
        high_risk_pct = int(high_risk_pct * factor)
        medium_risk_pct = int(medium_risk_pct * factor)
        low_risk_pct = 100 - critical_risk_pct - high_risk_pct - medium_risk_pct
    
    # Module counts (absolute)
    critical_modules = risk_distribution["critical"]
    high_risk_modules = risk_distribution["high"]
    medium_risk_modules = risk_distribution["medium"]
    low_risk_modules = risk_distribution["low"]
    
    # Test detection
    has_tests = detect_has_tests(nodes)
    
    # Calculate derived metrics
    maintainability = calculate_maintainability(
        risk_distribution, avg_complexity, total_loc, repo_size
    )
    
    architecture_health = calculate_architecture_health(
        graph_density, centrality_concentration, blast_radius_concentration,
        unresolved_imports / max(1, total_edges), total_loc, dependency_confidence
    )
    
    modernization_readiness = calculate_modernization_readiness(
        architecture_health, maintainability, total_loc, has_tests
    )
    
    technical_debt = calculate_technical_debt(
        total_loc, critical_modules, high_risk_modules, avg_complexity, has_tests, repo_size
    )
    
    refactoring_effort = calculate_refactoring_effort(
        critical_modules, high_risk_modules, medium_risk_modules, repo_size
    )
    
    velocity_loss = calculate_velocity_loss(
        critical_modules, high_risk_modules, total_nodes, avg_complexity
    )
    
    bug_fix_overhead = calculate_bug_fix_overhead(
        critical_modules, high_risk_modules, medium_risk_modules, has_tests, repo_size
    )
    
    # Risk concentration
    risk_concentration = calculate_concentration(node_risks)
    
    # Before/After
    before_mod, after_mod = calculate_before_after(
        maintainability, technical_debt, critical_modules, avg_complexity
    )
    
    # Build result
    result = MetricsResult(
        total_files=total_files,
        total_loc=total_loc,
        total_languages=total_languages,
        total_nodes=total_nodes,
        total_edges=total_edges,
        resolved_edges=resolved_edges,
        unresolved_imports=unresolved_imports,
        dependency_confidence=round(dependency_confidence, 2),
        critical_risk_pct=critical_risk_pct,
        high_risk_pct=high_risk_pct,
        medium_risk_pct=medium_risk_pct,
        low_risk_pct=low_risk_pct,
        critical_modules=critical_modules,
        high_risk_modules=high_risk_modules,
        medium_risk_modules=medium_risk_modules,
        low_risk_modules=low_risk_modules,
        maintainability_score=maintainability,
        architecture_health=architecture_health,
        modernization_readiness=modernization_readiness,
        technical_debt_estimate=technical_debt,
        refactoring_effort=refactoring_effort,
        velocity_loss=velocity_loss,
        bug_fix_overhead=bug_fix_overhead,
        risk_concentration=round(risk_concentration, 2),
        blast_radius_concentration=round(blast_radius_concentration, 2),
        centrality_concentration=round(centrality_concentration, 2),
        validation_warnings=[],
        before_modernization=before_mod,
        after_modernization=after_mod
    )
    
    # Validate and add warnings
    result.validation_warnings = validate_metrics(result)
    
    return result


def metrics_to_dict(result: MetricsResult) -> Dict[str, Any]:
    """Convert metrics result to dictionary for API responses"""
    return {
        # Core
        "total_files": result.total_files,
        "total_loc": result.total_loc,
        "total_languages": result.total_languages,
        "total_nodes": result.total_nodes,
        "total_edges": result.total_edges,
        "resolved_edges": result.resolved_edges,
        "unresolved_imports": result.unresolved_imports,
        "dependency_confidence": result.dependency_confidence,
        
        # Risk percentages
        "critical_risk": result.critical_risk_pct,
        "high_risk": result.high_risk_pct,
        "medium_risk": result.medium_risk_pct,
        "low_risk": result.low_risk_pct,
        
        # Module counts
        "critical_modules": result.critical_modules,
        "high_risk_modules": result.high_risk_modules,
        "medium_risk_modules": result.medium_risk_modules,
        "low_risk_modules": result.low_risk_modules,
        
        # Scores
        "maintainability_score": result.maintainability_score,
        "architecture_health": result.architecture_health,
        "modernization_readiness": result.modernization_readiness,
        
        # Estimates
        "technical_debt_estimate": result.technical_debt_estimate,
        "refactoring_effort": result.refactoring_effort,
        "velocity_loss": result.velocity_loss,
        "bug_fix_overhead": result.bug_fix_overhead,
        
        # Concentrations
        "risk_concentration": result.risk_concentration,
        "blast_radius_concentration": result.blast_radius_concentration,
        "centrality_concentration": result.centrality_concentration,
        
        # Before/After
        "before_modernization": result.before_modernization,
        "after_modernization": result.after_modernization,
        
        # Validation
        "validation_warnings": result.validation_warnings,
    }