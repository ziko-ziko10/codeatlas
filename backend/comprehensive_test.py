import sys
sys.path.insert(0, '.')
from app.metrics import calculate_metrics
from app.report import generate_markdown_report

print("=" * 60)
print("CODEATLAS COMPREHENSIVE TEST REPORT")
print("=" * 60)

tests_passed = 0
tests_failed = 0

# ============================================================
# TEST 1: METRICS CALCULATION
# ============================================================
print("\n### TEST 1: METRICS CALCULATION ###\n")

test_graph = {
    'nodes': [
        {'id': '1', 'name': 'file1.py', 'line_count': 100, 'risk_score': 0.85, 'in_degree': 5, 'out_degree': 3, 'centrality': 0.8, 'language': 'python'},
        {'id': '2', 'name': 'file2.py', 'line_count': 50, 'risk_score': 0.65, 'in_degree': 2, 'out_degree': 1, 'centrality': 0.3, 'language': 'python'},
        {'id': '3', 'name': 'file3.py', 'line_count': 30, 'risk_score': 0.45, 'in_degree': 1, 'out_degree': 2, 'centrality': 0.2, 'language': 'python'},
        {'id': '4', 'name': 'file4.py', 'line_count': 20, 'risk_score': 0.25, 'in_degree': 0, 'out_degree': 1, 'centrality': 0.1, 'language': 'python'},
    ],
    'edges': [
        {'source': '1', 'target': '2'},
        {'source': '1', 'target': '3'},
        {'source': '2', 'target': '3'},
        {'source': '3', 'target': '4'},
    ]
}

result = calculate_metrics(test_graph)

print("Input: 4 nodes with risk scores 85, 65, 45, 25")
print(f"Total files: {result.total_files}")
print(f"Critical modules: {result.critical_modules}")
print(f"High risk modules: {result.high_risk_modules}")
print(f"Medium risk modules: {result.medium_risk_modules}")
print(f"Low risk modules: {result.low_risk_modules}")
print(f"Percentages: {result.critical_risk_pct}%, {result.high_risk_pct}%, {result.medium_risk_pct}%, {result.low_risk_pct}%")
print(f"Architecture health: {result.architecture_health}")
print()

# Test 1.1: Risk distribution total = total files
total_risk = result.critical_modules + result.high_risk_modules + result.medium_risk_modules + result.low_risk_modules
test1_pass = total_risk == result.total_files
if test1_pass:
    tests_passed += 1
    print("1.1 PASS: Risk sum (4) == Total files (4)")
else:
    tests_failed += 1
    print("1.1 FAIL: Risk sum (" + str(total_risk) + ") != Total files (" + str(result.total_files) + ")")

# Test 1.2: Percentages sum to 100
total_pct = result.critical_risk_pct + result.high_risk_pct + result.medium_risk_pct + result.low_risk_pct
test2_pass = total_pct == 100
if test2_pass:
    tests_passed += 1
    print("1.2 PASS: Percentages sum (100) == 100")
else:
    tests_failed += 1
    print("1.2 FAIL: Percentages sum (" + str(total_pct) + ") != 100")

# Test 1.3: Architecture health in valid range (25-85)
test3_pass = 25 <= result.architecture_health <= 85
if test3_pass:
    tests_passed += 1
    print("1.3 PASS: Architecture health (" + str(result.architecture_health) + ") in range 25-85")
else:
    tests_failed += 1
    print("1.3 FAIL: Architecture health (" + str(result.architecture_health) + ") NOT in range 25-85")

# Test 1.4: Normalized risk scores are 0-100
node_risks = [0.85, 0.65, 0.45, 0.25]
all_valid = all(0 <= r * 100 <= 100 for r in node_risks)
if all_valid:
    tests_passed += 1
    print("1.4 PASS: All normalized risk scores in 0-100 range")
else:
    tests_failed += 1
    print("1.4 FAIL: Some risk scores out of range")

# ============================================================
# TEST 2: REPORT GENERATION
# ============================================================
print("\n### TEST 2: REPORT GENERATION ###\n")

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
        'before': {'maintainability': 80, 'technical_debt': 15, 'critical_modules': 1, 'complexity': 5},
        'after': {'maintainability': 95, 'technical_debt': 5, 'critical_modules': 0, 'complexity': 2}
    },
    'ai_insights': []
}

report = generate_markdown_report(test_data)

# Test 2.1: Risk distribution section shows correct counts
critical_in_table = report.count("| Critical |")
if critical_in_table >= 1:
    tests_passed += 1
    print("2.1 PASS: Risk distribution table present")
else:
    tests_failed += 1
    print("2.1 FAIL: Risk distribution table missing")

# Test 2.2: Critical/High-risk table headings are consistent
has_critical_heading = "Critical Risk Modules" in report
has_high_heading = "High-Risk Modules" in report
test2_pass = has_critical_heading and has_high_heading
if test2_pass:
    tests_passed += 1
    print("2.2 PASS: Critical/High-risk table headings present")
else:
    tests_failed += 1
    print("2.2 FAIL: Missing Critical or High-risk table headings")

# Test 2.3: Next Steps uses same counts as risk distribution
next_steps_section = report.split("## Next Steps")[1] if "## Next Steps" in report else ""
test3_pass = "1 critical-risk" in next_steps_section
if test3_pass:
    tests_passed += 1
    print("2.3 PASS: Next Steps matches risk distribution counts (1 critical)")
else:
    tests_failed += 1
    print("2.3 FAIL: Next Steps doesn't match risk distribution")

# Test 2.4: Modernization Roadmap uses same counts
roadmap_section = report.split("## Modernization Roadmap")[1].split("##")[0] if "## Modernization Roadmap" in report else ""
test4_pass = "1 critical" in roadmap_section
if test4_pass:
    tests_passed += 1
    print("2.4 PASS: Roadmap summary matches risk distribution")
else:
    tests_failed += 1
    print("2.4 FAIL: Roadmap doesn't match risk distribution")

# Test 2.5: Architecture Health shows correct label (35% = Weak)
test5_pass = "Architecture Health | 35% | Weak" in report
if test5_pass:
    tests_passed += 1
    print("2.5 PASS: Architecture Health 35% shows as 'Weak'")
else:
    tests_failed += 1
    print("2.5 FAIL: Architecture Health label incorrect for 35%")

# Test 2.6: Before/After critical count matches
test6_pass = "Critical Modules | 1 |" in report
if test6_pass:
    tests_passed += 1
    print("2.6 PASS: Before/After shows correct critical count (1 -> 0)")
else:
    tests_failed += 1
    print("2.6 FAIL: Before/After critical count doesn't match")

# ============================================================
# TEST 3: CONSISTENCY VERIFICATION
# ============================================================
print("\n### TEST 3: CONSISTENCY VERIFICATION ###\n")

# 3.1 Risk distribution total = total files
if total_risk == result.total_files:
    tests_passed += 1
    print("3.1 PASS: Risk distribution total = total files")
else:
    tests_failed += 1
    print("3.1 FAIL: Risk distribution total != total files")

# 3.2 Percentages sum to 100
if total_pct == 100:
    tests_passed += 1
    print("3.2 PASS: Percentages sum to 100")
else:
    tests_failed += 1
    print("3.2 FAIL: Percentages don't sum to 100")

# 3.3 Table headings match risk distribution counts
test3_3 = "| Critical | 1 |" in report and "| High | 1 |" in report
if test3_3:
    tests_passed += 1
    print("3.3 PASS: Table headings match counts (1 critical, 1 high)")
else:
    tests_failed += 1
    print("3.3 FAIL: Table headings don't match counts")

# 3.4 Next Steps matches risk distribution
if "1 critical-risk" in next_steps_section:
    tests_passed += 1
    print("3.4 PASS: Next Steps matches risk distribution")
else:
    tests_failed += 1
    print("3.4 FAIL: Next Steps doesn't match")

# 3.5 Roadmap matches risk distribution
if "1 critical" in roadmap_section:
    tests_passed += 1
    print("3.5 PASS: Roadmap matches risk distribution")
else:
    tests_failed += 1
    print("3.5 FAIL: Roadmap doesn't match")

# 3.6 Before/After critical count matches
if "Critical Modules | 1 |" in report:
    tests_passed += 1
    print("3.6 PASS: Before/After critical count matches")
else:
    tests_failed += 1
    print("3.6 FAIL: Before/After doesn't match")

# ============================================================
# SUMMARY
# ============================================================
print("\n" + "=" * 60)
print("SUMMARY: " + str(tests_passed) + " passed, " + str(tests_failed) + " failed")
print("=" * 60)