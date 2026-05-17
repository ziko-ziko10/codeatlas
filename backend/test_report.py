import sys
sys.path.insert(0, '.')
from app.report import generate_markdown_report

print("=== REPORT GENERATION TEST ===\n")

test_data = {
    'repo_name': 'TestRepo',
    'repo_path': '/test/path',
    'scanned_at': '2024-01-01 12:00:00',
    'metadata': {
        'total_files': 4,
        'total_languages': 1
    },
    'graph': {
        'node_count': 4,
        'edge_count': 4,
        'total_loc': 200,
        'nodes': [
            {'name': 'file1.py', 'path': '/test/file1.py', 'risk_score': 85, 'language': 'python', 'line_count': 100, 'centrality': 0.8, 'in_degree': 5},
            {'name': 'file2.py', 'path': '/test/file2.py', 'risk_score': 65, 'language': 'python', 'line_count': 50, 'centrality': 0.3, 'in_degree': 2},
            {'name': 'file3.py', 'path': '/test/file3.py', 'risk_score': 45, 'language': 'python', 'line_count': 30, 'centrality': 0.2, 'in_degree': 1},
            {'name': 'file4.py', 'path': '/test/file4.py', 'risk_score': 25, 'language': 'python', 'line_count': 20, 'centrality': 0.1, 'in_degree': 0},
        ]
    },
    'metrics': {
        'maintainability_score': 80,
        'technical_debt_estimate': 15,
        'architecture_health': 35,
        'modernization_readiness': 60,
        'velocity_loss': 20,
        'bug_fix_overhead': 10,
        'refactoring_effort': 4
    },
    'timeline': {'phases': []},
    'blast_radius': {'dependency_confidence': 0.9},
    'before_after': {
        'before': {'maintainability': 80, 'technical_debt': 15, 'critical_modules': 0, 'complexity': 5},
        'after': {'maintainability': 95, 'technical_debt': 5, 'critical_modules': 0, 'complexity': 2}
    },
    'ai_insights': []
}

report = generate_markdown_report(test_data)

# Check critical count in report
critical_in_report = report.count("Critical |")
print("Risk Distribution Table rows in report:", report.count("| Critical |"))

# Check for sections that should match
print("\n=== Section checks ===")
print("Has 'Risk Distribution':", "Risk Distribution" in report)
print("Has 'Critical Risk Modules':", "Critical Risk Modules" in report)
print("Has 'High-Risk Modules':", "High-Risk Modules" in report)
print("Has 'Next Steps':", "Next Steps" in report)
print("Has 'Modernization Roadmap':", "Modernization Roadmap" in report)
print("Has 'Before vs After':", "Before vs After" in report)

# Architecture Health check
print("\n=== Architecture Health Label Check ===")
# 35% should show as "Weak"
if "Architecture Health | 35% | Weak" in report:
    print("TEST PASS: 35% = Weak label correct")
else:
    print("Searching for Architecture Health section...")
    for line in report.split('\n'):
        if 'Architecture Health' in line and '|' in line:
            print(f"  Found: {line}")

# Extract critical count from report
print("\n=== Counting critical modules in Next Steps ===")
next_steps_section = report.split("## Next Steps")[1] if "## Next Steps" in report else ""
critical_in_next = next_steps_section.count("critical-risk")
print(f"References to critical-risk in Next Steps: {critical_in_next}")

# Check before/after critical count
print("\n=== Before/After Critical Count ===")
before_after_section = report.split("## Before vs After")[1] if "## Before vs After" in report else ""
print("Before/After section found:", "Before vs After" in report)

# Print first part of report for inspection
print("\n=== Report Preview (first 100 lines) ===")
for i, line in enumerate(report.split('\n')[:100]):
    print(f"{i+1}: {line}")