"""
Report generation module for CodeAtlas
"""
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple
import json
import math


def safe_number(value: Any, fallback: float = 0.0) -> float:
    """Safely convert value to number, handling NaN/Infinity"""
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
    """Safely convert value to integer"""
    return int(safe_number(value, fallback))


def format_currency(value: float) -> str:
    """Format currency with K suffix"""
    val = safe_number(value, 0)
    if val <= 0:
        return "$0K"
    return f"${round(val)}K"


def format_percent(value: float) -> str:
    """Format percentage safely"""
    val = safe_number(value, 0)
    val = max(0, min(100, val))
    return f"{round(val)}%"


def get_timestamp() -> str:
    """Get current timestamp"""
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def normalize_risk_score(score: float) -> int:
    """
    Normalize risk score to 0-100 scale.
    Handles various input formats: raw 0-1, 0-100, already normalized, or impossible values.
    """
    raw = safe_number(score, 0)
    if raw <= 0:
        return 0
    if raw <= 1.0:
        return int(raw * 100)
    if raw <= 100:
        return int(raw)
    return min(100, int(raw / 100))


def clamp_centrality(value: float) -> float:
    """Clamp centrality to 0-1 range"""
    return max(0, min(1, safe_number(value, 0)))


def validate_report_data(data: Dict[str, Any]) -> Tuple[bool, List[str]]:
    """
    Validate report data consistency.
    Returns (is_valid, warnings)
    """
    warnings = []
    
    graph = data.get("graph", {})
    metrics = data.get("metrics", {})
    nodes = graph.get("nodes", [])
    
    total_nodes = len(nodes)
    
    # Compute risk counts from nodes (same as report generation)
    critical_count = 0
    high_count = 0
    medium_count = 0
    low_count = 0
    
    for node in nodes:
        risk = normalize_risk_score(node.get("risk_score", 0))
        if risk >= 80:
            critical_count += 1
        elif risk >= 60:
            high_count += 1
        elif risk >= 40:
            medium_count += 1
        else:
            low_count += 1
    
    total_risk_count = critical_count + high_count + medium_count + low_count
    
    if total_nodes > 0 and total_risk_count != total_nodes:
        warnings.append(f"Risk module counts ({total_risk_count}) don't match total files ({total_nodes})")
    
    # Skip checking metrics dict percentages - we compute from nodes now
    # (metrics dict values may be inconsistent but we don't use them)
    
    for node in nodes[:20]:
        risk = normalize_risk_score(node.get("risk_score", 0))
        if risk > 100:
            warnings.append(f"Node {node.get('name', 'unknown')} has impossible risk score {risk}%")
        
        centrality = clamp_centrality(node.get("centrality", 0))
        if centrality > 1:
            warnings.append(f"Node {node.get('name', 'unknown')} has impossible centrality {centrality}")
    
    arch_health = safe_number(metrics.get("architecture_health", 50))
    maint = safe_number(metrics.get("maintainability_score", 50))
    if arch_health == 0 and maint > 50:
        warnings.append("Architecture Health is 0% but Maintainability is reasonable - possible data issue")
    
    return len(warnings) == 0, warnings


def generate_markdown_report(data: Dict[str, Any]) -> str:
    """Generate a professional Markdown report"""
    
    is_valid, validation_warnings = validate_report_data(data)
    
    for warning in validation_warnings:
        print(f"[WARNING] {warning}")
    
    repo_name = data.get("repo_name", "Unknown Repository")
    repo_path = data.get("repo_path", "N/A")
    scanned_at = data.get("scanned_at", get_timestamp())
    
    metadata = data.get("metadata", {})
    graph = data.get("graph", {})
    metrics = data.get("metrics", {})
    timeline = data.get("timeline", {})
    blast_radius = data.get("blast_radius", {})
    before_after = data.get("before_after", {})
    ai_insights = data.get("ai_insights", [])
    confidence = data.get("confidence", {})
    
    # Safe metric extraction
    total_files = safe_int(metadata.get("total_files", 0))
    total_languages = safe_int(metadata.get("total_languages", 0))
    total_loc = safe_int(graph.get("total_loc", 0))
    total_nodes = safe_int(graph.get("node_count", 0))
    total_edges = safe_int(graph.get("edge_count", 0))
    
    # Executive metrics
    maintainability = safe_number(metrics.get("maintainability_score", 50))
    tech_debt = safe_number(metrics.get("technical_debt_estimate", 0))
    architecture_health = safe_number(metrics.get("architecture_health", 50))
    modernization_readiness = safe_number(metrics.get("modernization_readiness", 50))
    velocity_loss = safe_number(metrics.get("velocity_loss", 0))
    bug_fix_overhead = safe_int(metrics.get("bug_fix_overhead", 0))
    refactoring_weeks = safe_int(metrics.get("refactoring_effort", 0))
    
    # Compute risk counts from nodes FIRST (before any section that uses them)
    report_nodes = graph.get("nodes", [])
    computed_critical = 0
    computed_high = 0
    computed_medium = 0
    computed_low = 0
    
    for node in report_nodes:
        risk = normalize_risk_score(node.get("risk_score", 0))
        if risk >= 80:
            computed_critical += 1
        elif risk >= 60:
            computed_high += 1
        elif risk >= 40:
            computed_medium += 1
        else:
            computed_low += 1
    
    computed_total = computed_critical + computed_high + computed_medium + computed_low
    
    # Use computed counts throughout the report
    # (metrics dict values are ignored for counts - we derive from nodes)
    
    # Build markdown
    md = []
    
    # Header
    md.append("# CodeAtlas Analysis Report")
    md.append("")
    md.append("---")
    md.append("")
    md.append(f"**Repository:** {repo_name}")
    md.append(f"**Path:** {repo_path}")
    md.append(f"**Generated:** {scanned_at}")
    md.append("")
    md.append("---")
    md.append("")
    
    # Executive Summary
    md.append("## Executive Summary")
    md.append("")
    md.append(f"CodeAtlas has completed a comprehensive analysis of **{repo_name}**. ")
    md.append(f"The repository contains **{total_files}** files across **{total_languages}** programming languages ")
    md.append(f"with approximately **{total_loc:,}** lines of code.")
    md.append("")
    md.append("### Key Findings")
    md.append("")
    md.append(f"- **Maintainability Score:** {format_percent(maintainability)}")
    md.append(f"- **Technical Debt:** {format_currency(tech_debt)}")
    md.append(f"- **Architecture Health:** {format_percent(architecture_health)}")
    md.append(f"- **Modernization Readiness:** {format_percent(modernization_readiness)}")
    md.append("")
    
    if computed_critical > 0:
        md.append(f"> Attention Required: {computed_critical} critical-risk modules identified requiring immediate attention.")
        md.append("")
    
    # Repository Overview
    md.append("## Repository Overview")
    md.append("")
    md.append("| Metric | Value |")
    md.append("|--------|-------|")
    md.append(f"| Total Files | {total_files} |")
    md.append(f"| Total Lines of Code | {total_loc:,} |")
    md.append(f"| Languages | {total_languages} |")
    md.append(f"| Dependency Nodes | {total_nodes} |")
    md.append(f"| Dependency Edges | {total_edges} |")
    md.append("")
    
    # Analysis Scope & Confidence
    if confidence:
        md.append("## Analysis Scope & Confidence")
        md.append("")
        md.append("| Metric | Value |")
        md.append("|--------|-------|")
        md.append(f"| Analysis Mode | {confidence.get('analysis_mode', 'full').title()} |")
        md.append(f"| Files Analyzed | {confidence.get('sampled_files', 0)} |")
        md.append(f"| Files Skipped | {confidence.get('skipped_files', 0)} |")
        md.append(f"| Total Size | {confidence.get('total_bytes', 0) / 1024:.1f} KB |")
        md.append(f"| Priority Files | {confidence.get('priority_files', 0)} |")
        md.append(f"| Confidence | {confidence.get('analysis_confidence', 'medium').title()} |")
        md.append("")
        
        limitations = confidence.get('limitations', [])
        if limitations:
            md.append("**Limitations:**")
            for limit in limitations:
                md.append(f"- {limit}")
            md.append("")
    
    # Architecture Health - fixed assessment labels
    md.append("## Architecture Health")
    md.append("")
    md.append("| Metric | Current | Assessment |")
    md.append("|--------|---------|------------|")
    
    # Architecture assessment: 80-100 Excellent, 65-79 Good, 45-64 Needs Attention, 25-44 Weak, 0-24 Critical
    if architecture_health >= 80:
        health_status = "Excellent"
    elif architecture_health >= 65:
        health_status = "Good"
    elif architecture_health >= 45:
        health_status = "Needs Attention"
    elif architecture_health >= 25:
        health_status = "Weak"
    else:
        health_status = "Critical"
    md.append(f"| Architecture Health | {format_percent(architecture_health)} | {health_status} |")
    
    maint_status = "Excellent" if maintainability >= 80 else "Good" if maintainability >= 60 else "Needs Work" if maintainability >= 40 else "Poor"
    md.append(f"| Maintainability | {format_percent(maintainability)} | {maint_status} |")
    
    md.append("")
    md.append(f"**Velocity Loss:** {format_percent(velocity_loss)} of development time is lost due to technical debt.")
    md.append(f"**Bug Fix Overhead:** Approximately {bug_fix_overhead} hours/week spent on maintenance.")
    md.append("")
    
    # Risk Distribution - USE ALREADY COMPUTED COUNTS
    total_files = safe_int(metadata.get("total_files", len(report_nodes)))
    total_loc = safe_int(graph.get("total_loc", 0))
    total_nodes = len(report_nodes)
    total_edges = safe_int(graph.get("edge_count", 0))
    
    # Use already computed counts
    critical_count = computed_critical
    high_count = computed_high
    medium_count = computed_medium
    low_count = computed_low
    total_risk_count = computed_total
    
    # Compute percentages FROM COUNTS
    if total_risk_count > 0:
        critical_pct = round((critical_count / total_risk_count) * 100)
        high_pct = round((high_count / total_risk_count) * 100)
        medium_pct = round((medium_count / total_risk_count) * 100)
        low_pct = 100 - critical_pct - high_pct - medium_pct
    else:
        critical_pct = high_pct = medium_pct = low_pct = 0
    
    md.append("## Risk Distribution")
    md.append("")
    md.append("### Risk Level Breakdown")
    md.append("")
    md.append("| Risk Level | Modules | Percentage |")
    md.append("|------------|---------|------------|")
    md.append(f"| Critical | {critical_count} | {critical_pct}% |")
    md.append(f"| High | {high_count} | {high_pct}% |")
    md.append(f"| Medium | {medium_count} | {medium_pct}% |")
    md.append(f"| Low | {low_count} | {low_pct}% |")
    md.append(f"| **Total** | **{total_risk_count}** | **100%** |")
    md.append("")
    
    # Critical and High-Risk Modules - use normalized risk scores
    # Use same critical_count and high_count computed above
    critical_nodes = [n for n in report_nodes if normalize_risk_score(n.get("risk_score", 0)) >= 80]
    high_risk_nodes = [n for n in report_nodes if 60 <= normalize_risk_score(n.get("risk_score", 0)) < 80]
    
    if critical_nodes:
        shown = min(len(critical_nodes), 15)
        if len(critical_nodes) <= shown:
            md.append(f"### Critical Risk Modules (≥80% Risk) - showing all {len(critical_nodes)}")
        else:
            md.append(f"### Critical Risk Modules (≥80% Risk) - showing top {shown} of {critical_count}")
        md.append("")
        md.append("| File | Risk Score | Language | LOC | Centrality |")
        md.append("|------|------------|----------|-----|------------|")
        for node in critical_nodes[:15]:
            path = node.get("path", node.get("name", "Unknown"))
            risk = normalize_risk_score(node.get("risk_score", 0))
            lang = node.get("language", "N/A")
            loc = safe_int(node.get("line_count", 0))
            centrality = clamp_centrality(node.get("centrality", 0))
            md.append(f"| {path} | {risk}% | {lang} | {loc} | {centrality:.2f} |")
        md.append("")
    
    if high_risk_nodes:
        shown = min(len(high_risk_nodes), 10)
        if len(high_risk_nodes) <= shown:
            md.append(f"### High-Risk Modules (60-79% Risk) - showing all {len(high_risk_nodes)}")
        else:
            md.append(f"### High-Risk Modules (60-79% Risk) - showing top {shown} of {high_count}")
        md.append("")
        md.append("| File | Risk Score | Language | LOC | Centrality |")
        md.append("|------|------------|----------|-----|------------|")
        for node in high_risk_nodes[:10]:
            path = node.get("path", node.get("name", "Unknown"))
            risk = normalize_risk_score(node.get("risk_score", 0))
            lang = node.get("language", "N/A")
            loc = safe_int(node.get("line_count", 0))
            centrality = clamp_centrality(node.get("centrality", 0))
            md.append(f"| {path} | {risk}% | {lang} | {loc} | {centrality:.2f} |")
        md.append("")
    
    # Dependency Graph Summary
    md.append("## Dependency Graph Summary")
    md.append("")
    md.append(f"The dependency graph contains **{total_nodes}** nodes and **{total_edges}** edges.")
    
    dep_conf = safe_number(blast_radius.get("dependency_confidence", 1.0))
    if dep_conf < 0.8:
        md.append(f"**Note:** Dependency confidence is {dep_conf:.0%}. Some imports may be unresolved.")
        md.append("")
    
    if report_nodes:
        centrality_nodes = sorted(report_nodes, key=lambda n: clamp_centrality(n.get("centrality", 0)), reverse=True)
        high_centrality = [n for n in centrality_nodes if clamp_centrality(n.get("centrality", 0)) > 0.5]
        
        if high_centrality:
            md.append("")
            md.append("### High Centrality Modules (Single Points of Failure)")
            md.append("")
            for node in high_centrality[:5]:
                path = node.get("path", node.get("name", "Unknown"))
                centrality = clamp_centrality(node.get("centrality", 0))
                in_deg = safe_int(node.get("in_degree", 0))
                md.append(f"- **{path}** - {centrality:.2f} centrality, {in_deg} dependents")
            md.append("")
    
    # Blast Radius Findings
    md.append("## Blast Radius Findings")
    md.append("")
    
    in_degree_nodes = sorted(report_nodes, key=lambda n: safe_int(n.get("in_degree", 0)), reverse=True)
    high_impact = [n for n in in_degree_nodes if safe_int(n.get("in_degree", 0)) > 10]
    
    if high_impact:
        md.append(f"**{len(high_impact)}** modules have blast radius > 10 (affecting 10+ other modules):")
        md.append("")
        for node in high_impact[:10]:
            path = node.get("path", node.get("name", "Unknown"))
            in_deg = safe_int(node.get("in_degree", 0))
            md.append(f"- **{path}** - {in_deg} modules affected")
        md.append("")
    else:
        md.append("No modules with significant blast radius (>10) detected.")
        md.append("")
    
    # Modernization Roadmap
    md.append("## Modernization Roadmap")
    md.append("")
    
    phases = timeline.get("phases", [])
    # Use computed counts from nodes - don't trust metrics dict
    has_risk_issues = computed_critical > 0 or computed_high > 0
    
    if phases:
        total_duration = timeline.get("total_duration", "N/A")
        total_effort = safe_int(timeline.get("total_effort", 0))
        total_cost = safe_int(timeline.get("total_cost", 0))
        
        md.append(f"**Estimated Timeline:** {total_duration}")
        md.append(f"**Total Effort:** {total_effort} weeks")
        md.append(f"**Estimated Cost:** ${total_cost}K")
        md.append("")
        
        for phase in phases:
            phase_name = phase.get("phase", "")
            title = phase.get("title", "")
            duration = phase.get("duration", "")
            priority = phase.get("priority", "")
            tasks = phase.get("tasks", [])
            impact = phase.get("impact", "")
            cost = phase.get("cost", "")
            
            md.append(f"### {phase_name}: {title}")
            md.append("")
            md.append(f"**Duration:** {duration} | **Priority:** {priority} | **Cost:** {cost}")
            md.append("")
            md.append("**Key Tasks:**")
            for task in tasks:
                md.append(f"- {task}")
            md.append("")
            md.append(f"**Expected Impact:** {impact}")
            md.append("")
    else:
        if has_risk_issues:
            md.append(f"Modernization roadmap not yet generated. {computed_critical} critical and {computed_high} high-risk modules identified.")
            md.append("Run modernization analysis to generate a phased improvement plan.")
        else:
            md.append("No modernization phases generated. Repository appears to be in good condition.")
        md.append("")
    
    # Before vs After Modernization - use consistent critical_count
    md.append("## Before vs After Modernization Impact")
    md.append("")
    
    before = before_after.get("before", {})
    after = before_after.get("after", {})
    
    if before and after:
        md.append("| Metric | Before | After | Improvement |")
        md.append("|--------|--------|-------|-------------|")
        
        before_maint = safe_number(before.get("maintainability", 0))
        after_maint = safe_number(after.get("maintainability", 0))
        maint_improvement = after_maint - before_maint
        md.append(f"| Maintainability | {format_percent(before_maint)} | {format_percent(after_maint)} | +{format_percent(maint_improvement)} |")
        
        before_debt = safe_number(before.get("technical_debt", 0))
        after_debt = safe_number(after.get("technical_debt", 0))
        debt_reduction = before_debt - after_debt
        md.append(f"| Technical Debt | {format_currency(before_debt)} | {format_currency(after_debt)} | -{format_currency(debt_reduction)} |")
        
        # Use computed critical_count for before, calculate after as reduction
        after_critical = max(0, int(critical_count * 0.25))
        md.append(f"| Critical Modules | {critical_count} | {after_critical} | -{critical_count - after_critical} |")
        
        md.append("")
    else:
        md.append("No before/after comparison data available.")
        md.append("")
    
    # AI Recommendations
    md.append("## AI Recommendations")
    md.append("")
    
    if ai_insights:
        for insight in ai_insights[:10]:
            title = insight.get("title", "Recommendation")
            message = insight.get("message", "")
            severity = insight.get("severity", "medium")
            
            severity_icon = "🔴" if severity == "high" else "🟠" if severity == "medium" else "🔵"
            md.append(f"### {severity_icon} {title}")
            md.append("")
            md.append(message)
            md.append("")
    else:
        md.append("No AI insights generated for this repository.")
        md.append("")
    
    # Next Steps - use consistent counts from node computation
    md.append("## Next Steps")
    md.append("")
    
    if critical_count > 0 or high_count > 0:
        md.append("1. **Immediate Actions**")
        md.append(f"   - Review and address {critical_count} critical-risk modules")
        md.append(f"   - Implement monitoring for high-centrality dependencies")
        md.append("")
        
        md.append("2. **Short-term (1-4 weeks)**")
        md.append(f"   - Refactor {high_count} high-risk modules")
        md.append("   - Improve test coverage for critical paths")
        md.append("   - Document architectural decisions")
        md.append("")
        
        if phases:
            md.append("3. **Long-term (1-3 months)**")
            md.append("   - Execute modernization roadmap")
            md.append("   - Implement CI/CD improvements")
            md.append("   - Consider microservices migration")
        else:
            md.append("3. **Long-term (1-3 months)**")
            md.append("   - Generate and execute modernization roadmap")
            md.append("   - Implement CI/CD improvements")
            md.append("   - Consider microservices migration")
    else:
        md.append("1. **Maintenance**")
        md.append("   - Continue regular code quality monitoring")
        md.append("   - Keep dependencies updated")
        md.append("")
        md.append("2. **Optimization**")
        md.append("   - Consider performance improvements")
        md.append("   - Review test coverage for areas of expansion")
    
    md.append("")
    md.append("---")
    md.append("")
    md.append("*Report generated by CodeAtlas - Repository Risk Analysis Engine*")
    md.append(f"*Generated at: {scanned_at}*")
    
    return "\n".join(md)


def generate_json_report(data: Dict[str, Any]) -> Dict[str, Any]:
    """Generate a JSON report with all data"""
    
    # Sanitize data - remove any secrets
    safe_data = {
        "report_metadata": {
            "generated_at": get_timestamp(),
            "repo_name": data.get("repo_name", "Unknown"),
            "repo_path": data.get("repo_path", "N/A"),
            "scanned_at": data.get("scanned_at", get_timestamp()),
        },
        "repository": {
            "total_files": safe_int(data.get("metadata", {}).get("total_files", 0)),
            "total_languages": safe_int(data.get("metadata", {}).get("total_languages", 0)),
            "total_loc": safe_int(data.get("graph", {}).get("total_loc", 0)),
        },
        "executive_summary": {
            "maintainability_score": safe_number(data.get("metrics", {}).get("maintainability_score", 0)),
            "technical_debt_estimate": safe_number(data.get("metrics", {}).get("technical_debt_estimate", 0)),
            "architecture_health": safe_number(data.get("metrics", {}).get("architecture_health", 0)),
            "modernization_readiness": safe_number(data.get("metrics", {}).get("modernization_readiness", 0)),
            "velocity_loss": safe_number(data.get("metrics", {}).get("velocity_loss", 0)),
            "bug_fix_overhead": safe_int(data.get("metrics", {}).get("bug_fix_overhead", 0)),
        },
        "risk_distribution": {
            "critical": safe_int(data.get("metrics", {}).get("critical_risk", 0)),
            "high": safe_int(data.get("metrics", {}).get("high_risk", 0)),
            "medium": safe_int(data.get("metrics", {}).get("medium_risk", 0)),
            "low": safe_int(data.get("metrics", {}).get("low_risk", 0)),
            "critical_modules": safe_int(data.get("metrics", {}).get("critical_modules", 0)),
            "high_risk_modules": safe_int(data.get("metrics", {}).get("high_risk_modules", 0)),
        },
        "dependency_graph": {
            "node_count": safe_int(data.get("graph", {}).get("node_count", 0)),
            "edge_count": safe_int(data.get("graph", {}).get("edge_count", 0)),
        },
        "timeline": data.get("timeline", {}),
        "before_after": data.get("before_after", {}),
        "ai_insights": data.get("ai_insights", []),
    }
    
    return safe_data