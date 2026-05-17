"""
Risk scoring logic for code files
"""
from typing import Dict
from app.config import RISK_WEIGHTS, RISK_THRESHOLDS


def calculate_risk_score(
    lines_of_code: int,
    complexity: float,
    todo_fixme_count: int,
    import_count: int,
    function_count: int,
) -> tuple[float, str]:
    """
    Calculate risk score for a file based on multiple factors.
    
    Args:
        lines_of_code: Number of lines in the file
        complexity: Cyclomatic complexity or similar metric
        todo_fixme_count: Number of TODO/FIXME comments
        import_count: Number of imports/dependencies
        function_count: Number of functions/methods
    
    Returns:
        Tuple of (risk_score, risk_level)
        - risk_score: 0-100 score
        - risk_level: "low", "medium", "high", or "critical"
    """
    # Normalize each factor to 0-100 scale
    factors = {
        "lines_of_code": _normalize_factor(
            lines_of_code,
            RISK_THRESHOLDS["lines_of_code"]["low"],
            RISK_THRESHOLDS["lines_of_code"]["high"],
        ),
        "complexity": _normalize_factor(
            complexity,
            RISK_THRESHOLDS["complexity"]["low"],
            RISK_THRESHOLDS["complexity"]["high"],
        ),
        "todo_fixme_count": _normalize_factor(
            todo_fixme_count,
            RISK_THRESHOLDS["todo_fixme_count"]["low"],
            RISK_THRESHOLDS["todo_fixme_count"]["high"],
        ),
        "import_count": _normalize_factor(
            import_count,
            RISK_THRESHOLDS["import_count"]["low"],
            RISK_THRESHOLDS["import_count"]["high"],
        ),
        "function_count": _normalize_factor(
            function_count,
            RISK_THRESHOLDS["function_count"]["low"],
            RISK_THRESHOLDS["function_count"]["high"],
        ),
    }
    
    # Calculate weighted score
    risk_score = sum(
        factors[factor] * RISK_WEIGHTS[factor]
        for factor in factors
    )
    
    # Determine risk level
    risk_level = _get_risk_level(risk_score)
    
    return round(risk_score, 2), risk_level


def _normalize_factor(value: float, low_threshold: float, high_threshold: float) -> float:
    """
    Normalize a factor value to 0-100 scale.
    
    Args:
        value: The actual value
        low_threshold: Value considered "low risk"
        high_threshold: Value considered "high risk"
    
    Returns:
        Normalized score (0-100)
    """
    if value <= low_threshold:
        return 0.0
    elif value >= high_threshold:
        return 100.0
    else:
        # Linear interpolation between low and high
        range_size = high_threshold - low_threshold
        position = value - low_threshold
        return (position / range_size) * 100.0


def _get_risk_level(score: float) -> str:
    """
    Convert numeric risk score to categorical level.
    
    Args:
        score: Risk score (0-100)
    
    Returns:
        Risk level: "low", "medium", "high", or "critical"
    """
    if score < 25:
        return "low"
    elif score < 50:
        return "medium"
    elif score < 75:
        return "high"
    else:
        return "critical"


def calculate_complexity_estimate(
    lines_of_code: int,
    function_count: int,
    class_count: int,
    nesting_indicators: int = 0,
) -> float:
    """
    Estimate code complexity based on structural metrics.
    This is a simplified complexity metric for the MVP.
    
    Args:
        lines_of_code: Number of lines
        function_count: Number of functions
        class_count: Number of classes
        nesting_indicators: Count of if/for/while/try statements
    
    Returns:
        Complexity score (approximate cyclomatic complexity)
    """
    # Base complexity
    base = 1
    
    # Add complexity for functions (each function adds decision points)
    function_complexity = function_count * 2
    
    # Add complexity for classes (inheritance, methods)
    class_complexity = class_count * 3
    
    # Add complexity for nesting
    nesting_complexity = nesting_indicators * 1.5
    
    # Scale by lines of code (larger files tend to be more complex)
    size_factor = min(lines_of_code / 100, 10)  # Cap at 10x
    
    total_complexity = (
        base + 
        function_complexity + 
        class_complexity + 
        nesting_complexity
    ) * (1 + size_factor / 10)
    
    return round(total_complexity, 2)

# Made with Bob
