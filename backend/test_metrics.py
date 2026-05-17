import sys
sys.path.insert(0, '.')
from app.metrics import calculate_metrics

print("=== METRICS CALCULATION TEST ===\n")

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
print(f"Total files: {result.total_files}")
print(f"Total nodes: {result.total_nodes}")
print(f"Critical modules: {result.critical_modules}")
print(f"High risk modules: {result.high_risk_modules}")
print(f"Medium risk modules: {result.medium_risk_modules}")
print(f"Low risk modules: {result.low_risk_modules}")
print(f"Critical risk %: {result.critical_risk_pct}")
print(f"High risk %: {result.high_risk_pct}")
print(f"Medium risk %: {result.medium_risk_pct}")
print(f"Low risk %: {result.low_risk_pct}")
print(f"Architecture health: {result.architecture_health}")
print(f"Before: {result.before_modernization}")
print(f"After: {result.after_modernization}")
print()

# Verify: Risk distribution total = total files
total_risk = result.critical_modules + result.high_risk_modules + result.medium_risk_modules + result.low_risk_modules
test1 = total_risk == result.total_files
print(f"TEST 1: Risk sum ({total_risk}) == Total files ({result.total_files}): {'PASS' if test1 else 'FAIL'}")

# Verify: Percentages sum to 100
total_pct = result.critical_risk_pct + result.high_risk_pct + result.medium_risk_pct + result.low_risk_pct
test2 = total_pct == 100
print(f"TEST 2: Percentage sum ({total_pct}) == 100: {'PASS' if test2 else 'FAIL'}")

# Verify: Architecture health is in valid range (25-85)
test3 = 25 <= result.architecture_health <= 85
print(f"TEST 3: Architecture health ({result.architecture_health}) in range 25-85: {'PASS' if test3 else 'FAIL'}")

# Test with different data - more files
print("\n=== TEST WITH MORE FILES ===\n")
test_graph2 = {
    'nodes': [
        {'id': str(i), 'name': f'file{i}.py', 'line_count': 100*i, 'risk_score': (i % 100)/100, 'in_degree': i, 'out_degree': i, 'centrality': 0.5, 'language': 'python'}
        for i in range(1, 11)
    ],
    'edges': [
        {'source': str(i), 'target': str(i+1)} for i in range(1, 10)
    ]
}

result2 = calculate_metrics(test_graph2)
total_risk2 = result2.critical_modules + result2.high_risk_modules + result2.medium_risk_modules + result2.low_risk_modules
total_pct2 = result2.critical_risk_pct + result2.high_risk_pct + result2.medium_risk_pct + result2.low_risk_pct

print(f"Total files: {result2.total_files}")
print(f"Total risk modules: {total_risk2}")
print(f"Total percentage: {total_pct2}")
print(f"Architecture health: {result2.architecture_health}")
print()

test4 = total_risk2 == result2.total_files
print(f"TEST 4: Risk sum ({total_risk2}) == Total files ({result2.total_files}): {'PASS' if test4 else 'FAIL'}")
test5 = total_pct2 == 100
print(f"TEST 5: Percentage sum ({total_pct2}) == 100: {'PASS' if test5 else 'FAIL'}")
test6 = 25 <= result2.architecture_health <= 85
print(f"TEST 6: Architecture health ({result2.architecture_health}) in range 25-85: {'PASS' if test6 else 'FAIL'}")