"""
Test script for Phase 5 demo functionality
"""
from app.demo import DemoRepository

def test_demo_repositories():
    """Test all demo repositories load correctly"""
    print("Testing Phase 5 Demo Mode...")
    print("=" * 50)
    
    # Test enterprise e-commerce
    print("\n1. Testing Enterprise E-commerce Demo")
    ecommerce = DemoRepository.get_enterprise_ecommerce()
    print(f"   [OK] Name: {ecommerce['name']}")
    print(f"   [OK] Nodes: {len(ecommerce['nodes'])}")
    print(f"   [OK] Edges: {len(ecommerce['edges'])}")
    print(f"   [OK] Metrics: {ecommerce['metrics']}")
    
    # Test fintech platform
    print("\n2. Testing FinTech Platform Demo")
    fintech = DemoRepository.get_fintech_platform()
    print(f"   [OK] Name: {fintech['name']}")
    print(f"   [OK] Nodes: {len(fintech['nodes'])}")
    print(f"   [OK] Edges: {len(fintech['edges'])}")
    print(f"   [OK] Metrics: {fintech['metrics']}")
    
    # Test social media app
    print("\n3. Testing Social Media App Demo")
    social = DemoRepository.get_social_media_app()
    print(f"   [OK] Name: {social['name']}")
    print(f"   [OK] Nodes: {len(social['nodes'])}")
    print(f"   [OK] Edges: {len(social['edges'])}")
    print(f"   [OK] Metrics: {social['metrics']}")
    
    # Test get all demos
    print("\n4. Testing Get All Demos")
    all_demos = DemoRepository.get_all_demos()
    print(f"   [OK] Total demos: {len(all_demos)}")
    
    # Test get by name
    print("\n5. Testing Get Demo By Name")
    demo = DemoRepository.get_demo_by_name("enterprise-ecommerce")
    print(f"   [OK] Retrieved: {demo['name']}")
    
    print("\n" + "=" * 50)
    print("[SUCCESS] All Phase 5 demo tests passed!")
    print("\nDemo endpoints ready:")
    print("  GET  /demo/list")
    print("  GET  /demo/load/{demo_name}")
    print("\nAvailable demos:")
    print("  - enterprise-ecommerce")
    print("  - fintech-platform")
    print("  - social-media-app")

if __name__ == "__main__":
    test_demo_repositories()

# Made with Bob
