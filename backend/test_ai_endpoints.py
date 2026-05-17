"""
Test script for AI endpoints
Run with: python test_ai_endpoints.py
"""
import asyncio
import sys
from pathlib import Path

# Add app to path
sys.path.insert(0, str(Path(__file__).parent))

from app.ai import AIInsightEngine
from app.models import FileInfo, ScanResult, RepositoryMetadata, LanguageSummary
from datetime import datetime


async def test_module_insight():
    """Test module insight generation"""
    print("\n=== Testing Module Insight ===")
    
    # Create a sample file info
    file_info = FileInfo(
        path="src/app.py",
        name="app.py",
        extension=".py",
        language="python",
        size_bytes=15000,
        lines_of_code=450,
        import_count=23,
        function_count=15,
        class_count=3,
        todo_count=5,
        fixme_count=2,
        complexity_score=12.5,
        risk_score=0.78,
        risk_level="high"
    )
    
    engine = AIInsightEngine()
    insight = await engine.generate_module_insight(file_info)
    
    print(f"[OK] File: {insight['file_path']}")
    print(f"[OK] Purpose: {insight['purpose'][:80]}...")
    print(f"[OK] Technical Debt: {insight['technical_debt'][:80]}...")
    print(f"[OK] Confidence: {insight['confidence_score']:.2f}")
    print(f"[OK] Risks: {len(insight['change_risks'])} identified")
    print(f"[OK] Tests: {len(insight['suggested_tests'])} suggested")
    
    return True


async def test_repo_summary():
    """Test repository summary generation"""
    print("\n=== Testing Repository Summary ===")
    
    # Create sample scan result
    metadata = RepositoryMetadata(
        path="/test/repo",
        name="test-project",
        total_files=127,
        total_lines=15420,
        total_size_bytes=500000,
        scanned_at=datetime.now(),
        scan_duration_seconds=2.5,
        languages=[
            LanguageSummary(
                language="python",
                file_count=85,
                total_lines=12000,
                avg_risk_score=0.45,
                extensions=[".py"]
            ),
            LanguageSummary(
                language="javascript",
                file_count=42,
                total_lines=3420,
                avg_risk_score=0.38,
                extensions=[".js"]
            )
        ]
    )
    
    # Create sample files
    files = [
        FileInfo(
            path=f"src/module_{i}.py",
            name=f"module_{i}.py",
            extension=".py",
            language="python",
            size_bytes=5000,
            lines_of_code=150,
            import_count=10,
            function_count=5,
            class_count=1,
            todo_count=1,
            fixme_count=0,
            complexity_score=8.0,
            risk_score=0.5 + (i * 0.05),
            risk_level="medium" if i < 5 else "high"
        )
        for i in range(10)
    ]
    
    scan_result = ScanResult(
        metadata=metadata,
        files=files,
        folders=[],
        summary={}
    )
    
    engine = AIInsightEngine()
    summary = await engine.generate_repo_summary(scan_result)
    
    print(f"[OK] Repository: {summary['repository_name']}")
    print(f"[OK] Files: {summary['total_files']}")
    print(f"[OK] Languages: {', '.join(summary['languages'])}")
    print(f"[OK] Top Risks: {len(summary['top_risks'])} identified")
    print(f"[OK] Critical Modules: {len(summary['critical_modules'])}")
    print(f"[OK] Priorities: {len(summary['modernization_priorities'])}")
    print(f"[OK] Onboarding: {summary['onboarding_difficulty']['level']}")
    
    return True


async def test_documentation():
    """Test documentation generation"""
    print("\n=== Testing Documentation Generation ===")
    
    # Create minimal scan result
    metadata = RepositoryMetadata(
        path="/test/repo",
        name="test-project",
        total_files=50,
        total_lines=5000,
        total_size_bytes=200000,
        scanned_at=datetime.now(),
        scan_duration_seconds=1.5,
        languages=[
            LanguageSummary(
                language="python",
                file_count=50,
                total_lines=5000,
                avg_risk_score=0.4,
                extensions=[".py"]
            )
        ]
    )
    
    files = [
        FileInfo(
            path="src/app.py",
            name="app.py",
            extension=".py",
            language="python",
            size_bytes=5000,
            lines_of_code=150,
            import_count=10,
            function_count=5,
            class_count=1,
            todo_count=1,
            fixme_count=0,
            complexity_score=8.0,
            risk_score=0.6,
            risk_level="medium"
        )
    ]
    
    scan_result = ScanResult(
        metadata=metadata,
        files=files,
        folders=[],
        summary={}
    )
    
    engine = AIInsightEngine()
    
    doc_types = ["ARCHITECTURE", "ONBOARDING", "RISK_REPORT", "MODERNIZATION_PLAN"]
    
    for doc_type in doc_types:
        doc = await engine.generate_documentation(scan_result, doc_type)
        print(f"[OK] {doc_type}: {len(doc)} characters generated")
        assert "# " in doc, f"{doc_type} should contain markdown headers"
        assert "CodeAtlas AI" in doc, f"{doc_type} should contain AI signature"
    
    return True


async def main():
    """Run all tests"""
    print("=" * 60)
    print("AI Endpoints Test Suite")
    print("=" * 60)
    
    try:
        await test_module_insight()
        await test_repo_summary()
        await test_documentation()
        
        print("\n" + "=" * 60)
        print("[SUCCESS] All tests passed!")
        print("=" * 60)
        
    except Exception as e:
        print("\n" + "=" * 60)
        print(f"[FAILED] Test failed: {e}")
        print("=" * 60)
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())

# Made with Bob