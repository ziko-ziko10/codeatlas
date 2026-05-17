"""
Test script for graph and blast radius endpoints
"""
import requests
import json
from pathlib import Path

BASE_URL = "http://localhost:8000"

def test_graph_endpoint():
    """Test the /graph endpoint"""
    print("\n=== Testing /graph endpoint ===")
    
    # Use the backend directory itself as test data
    test_path = str(Path(__file__).parent.resolve())
    
    payload = {
        "path": test_path,
        "include_hidden": False,
        "max_depth": 3
    }
    
    print(f"Request: POST {BASE_URL}/graph")
    print(f"Payload: {json.dumps(payload, indent=2)}")
    
    try:
        response = requests.post(f"{BASE_URL}/graph", json=payload)
        print(f"\nStatus Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"\nGraph Statistics:")
            print(f"  - Total Nodes: {data['metrics']['total_nodes']}")
            print(f"  - Total Edges: {data['metrics']['total_edges']}")
            print(f"  - Density: {data['metrics']['density']}")
            print(f"  - Avg In-Degree: {data['metrics']['avg_in_degree']}")
            print(f"  - Avg Out-Degree: {data['metrics']['avg_out_degree']}")
            
            print(f"\nCritical Modules (Top 5):")
            for i, module in enumerate(data['critical_modules'][:5], 1):
                print(f"  {i}. {module['path']}")
                print(f"     - Centrality: {module['centrality']}")
                print(f"     - In-Degree: {module['in_degree']}")
                print(f"     - Risk Score: {module['risk_score']}")
            
            print(f"\nSample Nodes (First 3):")
            for node in data['nodes'][:3]:
                print(f"  - {node['path']}")
                print(f"    Language: {node['language']}, Risk: {node['risk_level']}")
                print(f"    In-Degree: {node['in_degree']}, Out-Degree: {node['out_degree']}")
            
            print(f"\nSample Edges (First 5):")
            for edge in data['edges'][:5]:
                print(f"  - {edge['source']} -> {edge['target']}")
            
            return data
        else:
            print(f"Error: {response.text}")
            return None
    
    except Exception as e:
        print(f"Error: {e}")
        return None


def test_blast_radius_endpoint(graph_data):
    """Test the /blast-radius endpoint"""
    print("\n\n=== Testing /blast-radius endpoint ===")
    
    if not graph_data or not graph_data.get('nodes'):
        print("No graph data available for testing")
        return
    
    # Use the backend directory itself as test data
    test_path = str(Path(__file__).parent.resolve())
    
    # Find a file with dependencies for testing
    test_file = None
    for node in graph_data['nodes']:
        if node['out_degree'] > 0:  # Has dependencies
            test_file = node['path']
            break
    
    if not test_file:
        # Fallback to first file
        test_file = graph_data['nodes'][0]['path']
    
    payload = {
        "path": test_path,
        "changed_file": test_file,
        "include_hidden": False,
        "max_depth": 3
    }
    
    print(f"Request: POST {BASE_URL}/blast-radius")
    print(f"Changed File: {test_file}")
    
    try:
        response = requests.post(f"{BASE_URL}/blast-radius", json=payload)
        print(f"\nStatus Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"\nBlast Radius Analysis:")
            print(f"  - Changed File: {data['changed_file']}")
            print(f"  - Risk Severity: {data['risk_severity']}")
            print(f"  - Total Affected: {data['total_affected']}")
            print(f"  - Directly Affected: {len(data['directly_affected'])}")
            print(f"  - Indirectly Affected: {len(data['indirectly_affected'])}")
            
            print(f"\nFile Info:")
            print(f"  - Language: {data['file_info']['language']}")
            print(f"  - Risk Level: {data['file_info']['risk_level']}")
            print(f"  - Risk Score: {data['file_info']['risk_score']}")
            print(f"  - In-Degree: {data['file_info']['in_degree']}")
            print(f"  - Out-Degree: {data['file_info']['out_degree']}")
            print(f"  - Centrality: {data['file_info']['centrality']}")
            
            print(f"\nExplanation:")
            print(f"  {data['explanation']}")
            
            if data['risk_factors']:
                print(f"\nRisk Factors:")
                for factor in data['risk_factors']:
                    print(f"  - {factor}")
            
            print(f"\nTest Recommendations:")
            for i, rec in enumerate(data['test_recommendations'], 1):
                print(f"  {i}. {rec}")
            
            if data['directly_affected']:
                print(f"\nDirectly Affected Files (First 5):")
                for file in data['directly_affected'][:5]:
                    print(f"  - {file['path']} ({file['language']}, {file['risk_level']})")
            
            return data
        else:
            print(f"Error: {response.text}")
            return None
    
    except Exception as e:
        print(f"Error: {e}")
        return None


def main():
    """Run all tests"""
    print("=" * 60)
    print("CodeAtlas Phase 2 - Graph & Blast Radius Testing")
    print("=" * 60)
    
    # Test graph endpoint
    graph_data = test_graph_endpoint()
    
    # Test blast radius endpoint
    if graph_data:
        test_blast_radius_endpoint(graph_data)
    
    print("\n" + "=" * 60)
    print("Testing Complete!")
    print("=" * 60)


if __name__ == "__main__":
    main()

# Made with Bob
