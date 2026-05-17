"""
Quick test script for the scanner
"""
import sys
import json
from pathlib import Path

# Add app to path
sys.path.insert(0, str(Path(__file__).parent))

from app.scanner import RepositoryScanner

def test_scanner():
    """Test the scanner with the backend directory itself"""
    print("Testing CodeAtlas Scanner...")
    print("-" * 50)
    
    # Scan the backend directory
    repo_path = Path(__file__).parent
    print(f"Scanning: {repo_path}")
    print()
    
    try:
        scanner = RepositoryScanner(str(repo_path))
        result = scanner.scan()
        
        print("[OK] Scan completed successfully!")
        print()
        
        # Print metadata
        print("Repository Metadata:")
        print(f"  Name: {result.metadata.name}")
        print(f"  Total Files: {result.metadata.total_files}")
        print(f"  Total Lines: {result.metadata.total_lines}")
        print(f"  Scan Duration: {result.metadata.scan_duration_seconds}s")
        print()
        
        # Print language summary
        print("Languages:")
        for lang in result.metadata.languages:
            print(f"  {lang.language}: {lang.file_count} files, {lang.total_lines} lines")
        print()
        
        # Print summary
        print("Summary:")
        print(f"  High Risk Files: {result.summary['high_risk_files']}")
        print(f"  Average Risk Score: {result.summary['avg_risk_score']}")
        print(f"  Total TODOs: {result.summary['total_todos']}")
        print(f"  Total FIXMEs: {result.summary['total_fixmes']}")
        print()
        
        # Print top 5 riskiest files
        print("Top 5 Riskiest Files:")
        sorted_files = sorted(result.files, key=lambda f: f.risk_score, reverse=True)[:5]
        for i, file in enumerate(sorted_files, 1):
            print(f"  {i}. {file.path}")
            print(f"     Risk: {file.risk_score} ({file.risk_level})")
            print(f"     LOC: {file.lines_of_code}, Complexity: {file.complexity_score}")
        print()
        
        # Save full result to JSON
        output_file = repo_path / "scan_result.json"
        with open(output_file, 'w') as f:
            json.dump(result.model_dump(), f, indent=2, default=str)
        print(f"[OK] Full results saved to: {output_file}")
        
    except Exception as e:
        print(f"[ERROR] Error: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    return True

if __name__ == "__main__":
    success = test_scanner()
    sys.exit(0 if success else 1)

# Made with Bob
