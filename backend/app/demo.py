"""
Demo Mode - Sample Repositories for CodeAtlas
Provides pre-configured demo data for hackathon presentations
"""
from typing import Dict, List, Any
from datetime import datetime
import random

class DemoRepository:
    """Generate realistic demo repository data"""
    
    @staticmethod
    def get_enterprise_ecommerce() -> Dict[str, Any]:
        """Large enterprise e-commerce platform"""
        return {
            "name": "enterprise-ecommerce",
            "description": "Legacy e-commerce platform with 500K+ LOC",
            "nodes": [
                {
                    "id": "auth-service",
                    "file_path": "services/auth/authentication.py",
                    "language": "Python",
                    "risk_score": 0.85,
                    "loc": 2500,
                    "imports": ["payment", "user-db", "session", "cache"],
                    "functions": ["login", "logout", "validate_token", "refresh_session"],
                    "classes": ["AuthManager", "TokenValidator"],
                    "centrality": 0.92,
                    "blast_radius": 17,
                    "modernization_recommendation": "Critical: Decouple authentication from payment workflows"
                },
                {
                    "id": "payment",
                    "file_path": "services/payment/processor.py",
                    "language": "Python",
                    "risk_score": 0.78,
                    "loc": 3200,
                    "imports": ["auth-service", "order", "inventory", "notification"],
                    "functions": ["process_payment", "refund", "validate_card"],
                    "classes": ["PaymentProcessor", "TransactionManager"],
                    "centrality": 0.88,
                    "blast_radius": 14,
                    "modernization_recommendation": "High: Extract payment gateway logic into microservice"
                },
                {
                    "id": "cache",
                    "file_path": "infrastructure/cache/redis_manager.py",
                    "language": "Python",
                    "risk_score": 0.92,
                    "loc": 1800,
                    "imports": ["auth-service", "product", "session", "cart"],
                    "functions": ["get", "set", "invalidate", "flush"],
                    "classes": ["CacheManager", "InvalidationStrategy"],
                    "centrality": 0.95,
                    "blast_radius": 23,
                    "modernization_recommendation": "Critical: Cache invalidation failures propagate across 17 modules"
                },
                {
                    "id": "user-db",
                    "file_path": "database/user_repository.py",
                    "language": "Python",
                    "risk_score": 0.65,
                    "loc": 2100,
                    "imports": ["auth-service", "profile", "order"],
                    "functions": ["find_user", "update_user", "delete_user"],
                    "classes": ["UserRepository", "UserModel"],
                    "centrality": 0.75,
                    "blast_radius": 9,
                    "modernization_recommendation": "Medium: Add proper indexing and query optimization"
                },
                {
                    "id": "order",
                    "file_path": "services/order/order_manager.py",
                    "language": "Python",
                    "risk_score": 0.72,
                    "loc": 2800,
                    "imports": ["payment", "inventory", "notification", "shipping"],
                    "functions": ["create_order", "cancel_order", "update_status"],
                    "classes": ["OrderManager", "OrderValidator"],
                    "centrality": 0.82,
                    "blast_radius": 11,
                    "modernization_recommendation": "High: Implement event-driven architecture for order processing"
                },
                {
                    "id": "inventory",
                    "file_path": "services/inventory/stock_manager.py",
                    "language": "Python",
                    "risk_score": 0.68,
                    "loc": 1900,
                    "imports": ["order", "product", "warehouse"],
                    "functions": ["check_stock", "reserve_items", "release_items"],
                    "classes": ["StockManager", "InventoryTracker"],
                    "centrality": 0.70,
                    "blast_radius": 8,
                    "modernization_recommendation": "Medium: Add distributed locking for concurrent stock updates"
                },
                {
                    "id": "product",
                    "file_path": "services/product/catalog.py",
                    "language": "Python",
                    "risk_score": 0.45,
                    "loc": 1500,
                    "imports": ["cache", "inventory"],
                    "functions": ["get_product", "search_products", "update_product"],
                    "classes": ["ProductCatalog", "SearchEngine"],
                    "centrality": 0.55,
                    "blast_radius": 5,
                    "modernization_recommendation": "Low: Well-structured, consider adding GraphQL API"
                },
                {
                    "id": "notification",
                    "file_path": "services/notification/email_service.py",
                    "language": "Python",
                    "risk_score": 0.58,
                    "loc": 1200,
                    "imports": ["order", "payment"],
                    "functions": ["send_email", "send_sms", "push_notification"],
                    "classes": ["NotificationService", "EmailTemplate"],
                    "centrality": 0.48,
                    "blast_radius": 4,
                    "modernization_recommendation": "Low: Consider message queue for async notifications"
                },
                {
                    "id": "session",
                    "file_path": "infrastructure/session/manager.py",
                    "language": "Python",
                    "risk_score": 0.75,
                    "loc": 1600,
                    "imports": ["auth-service", "cache"],
                    "functions": ["create_session", "validate_session", "destroy_session"],
                    "classes": ["SessionManager", "SessionStore"],
                    "centrality": 0.78,
                    "blast_radius": 10,
                    "modernization_recommendation": "High: Migrate to JWT tokens to reduce cache dependency"
                },
                {
                    "id": "cart",
                    "file_path": "services/cart/shopping_cart.py",
                    "language": "Python",
                    "risk_score": 0.52,
                    "loc": 1400,
                    "imports": ["product", "cache", "session"],
                    "functions": ["add_item", "remove_item", "calculate_total"],
                    "classes": ["ShoppingCart", "CartItem"],
                    "centrality": 0.60,
                    "blast_radius": 6,
                    "modernization_recommendation": "Medium: Implement cart persistence strategy"
                }
            ],
            "edges": [
                {"source": "auth-service", "target": "payment", "weight": 0.9},
                {"source": "auth-service", "target": "user-db", "weight": 0.95},
                {"source": "auth-service", "target": "session", "weight": 0.85},
                {"source": "auth-service", "target": "cache", "weight": 0.75},
                {"source": "payment", "target": "order", "weight": 0.9},
                {"source": "payment", "target": "inventory", "weight": 0.7},
                {"source": "payment", "target": "notification", "weight": 0.6},
                {"source": "cache", "target": "product", "weight": 0.8},
                {"source": "cache", "target": "session", "weight": 0.85},
                {"source": "cache", "target": "cart", "weight": 0.7},
                {"source": "order", "target": "inventory", "weight": 0.9},
                {"source": "order", "target": "notification", "weight": 0.7},
                {"source": "inventory", "target": "product", "weight": 0.8},
                {"source": "session", "target": "cache", "weight": 0.75},
                {"source": "cart", "target": "product", "weight": 0.85},
                {"source": "cart", "target": "cache", "weight": 0.7},
            ],
            "metrics": {
                "total_files": 247,
                "high_risk_modules": 4,
                "critical_modules": 3,
                "dependency_density": 0.68,
                "architecture_complexity": 8.7
            }
        }
    
    @staticmethod
    def get_fintech_platform() -> Dict[str, Any]:
        """Financial technology platform"""
        return {
            "name": "fintech-platform",
            "description": "Banking and investment platform with regulatory compliance",
            "nodes": [
                {
                    "id": "transaction-engine",
                    "file_path": "core/transaction/engine.py",
                    "language": "Python",
                    "risk_score": 0.95,
                    "loc": 4200,
                    "imports": ["ledger", "compliance", "fraud-detection", "audit"],
                    "functions": ["process_transaction", "validate_funds", "rollback"],
                    "classes": ["TransactionEngine", "TransactionValidator"],
                    "centrality": 0.98,
                    "blast_radius": 28,
                    "modernization_recommendation": "Critical: Monolithic transaction engine requires immediate decomposition"
                },
                {
                    "id": "ledger",
                    "file_path": "core/ledger/double_entry.py",
                    "language": "Python",
                    "risk_score": 0.88,
                    "loc": 3800,
                    "imports": ["transaction-engine", "account", "audit"],
                    "functions": ["debit", "credit", "balance", "reconcile"],
                    "classes": ["Ledger", "Entry", "Account"],
                    "centrality": 0.92,
                    "blast_radius": 19,
                    "modernization_recommendation": "Critical: Implement event sourcing for audit trail"
                },
                {
                    "id": "compliance",
                    "file_path": "regulatory/compliance_checker.py",
                    "language": "Python",
                    "risk_score": 0.82,
                    "loc": 2900,
                    "imports": ["transaction-engine", "kyc", "aml"],
                    "functions": ["check_limits", "verify_kyc", "flag_suspicious"],
                    "classes": ["ComplianceEngine", "RuleValidator"],
                    "centrality": 0.85,
                    "blast_radius": 15,
                    "modernization_recommendation": "High: Externalize compliance rules to configuration"
                },
                {
                    "id": "fraud-detection",
                    "file_path": "security/fraud/detector.py",
                    "language": "Python",
                    "risk_score": 0.78,
                    "loc": 3100,
                    "imports": ["transaction-engine", "ml-model", "alert"],
                    "functions": ["analyze_pattern", "score_risk", "block_transaction"],
                    "classes": ["FraudDetector", "RiskScorer"],
                    "centrality": 0.80,
                    "blast_radius": 12,
                    "modernization_recommendation": "High: Migrate ML models to separate inference service"
                }
            ],
            "edges": [
                {"source": "transaction-engine", "target": "ledger", "weight": 0.95},
                {"source": "transaction-engine", "target": "compliance", "weight": 0.9},
                {"source": "transaction-engine", "target": "fraud-detection", "weight": 0.85},
                {"source": "ledger", "target": "transaction-engine", "weight": 0.8},
                {"source": "compliance", "target": "transaction-engine", "weight": 0.75},
            ],
            "metrics": {
                "total_files": 189,
                "high_risk_modules": 3,
                "critical_modules": 2,
                "dependency_density": 0.82,
                "architecture_complexity": 9.4
            }
        }
    
    @staticmethod
    def get_social_media_app() -> Dict[str, Any]:
        """Social media application"""
        return {
            "name": "social-media-app",
            "description": "Social networking platform with real-time features",
            "nodes": [
                {
                    "id": "feed-generator",
                    "file_path": "features/feed/generator.py",
                    "language": "Python",
                    "risk_score": 0.72,
                    "loc": 2200,
                    "imports": ["post", "recommendation", "cache", "user"],
                    "functions": ["generate_feed", "rank_posts", "filter_content"],
                    "classes": ["FeedGenerator", "RankingAlgorithm"],
                    "centrality": 0.85,
                    "blast_radius": 13,
                    "modernization_recommendation": "High: Implement real-time streaming architecture"
                },
                {
                    "id": "recommendation",
                    "file_path": "ml/recommendation/engine.py",
                    "language": "Python",
                    "risk_score": 0.68,
                    "loc": 2800,
                    "imports": ["feed-generator", "user", "analytics"],
                    "functions": ["recommend_users", "recommend_content", "train_model"],
                    "classes": ["RecommendationEngine", "CollaborativeFilter"],
                    "centrality": 0.75,
                    "blast_radius": 9,
                    "modernization_recommendation": "Medium: Separate model training from inference"
                }
            ],
            "edges": [
                {"source": "feed-generator", "target": "recommendation", "weight": 0.8},
                {"source": "recommendation", "target": "feed-generator", "weight": 0.7},
            ],
            "metrics": {
                "total_files": 156,
                "high_risk_modules": 2,
                "critical_modules": 1,
                "dependency_density": 0.55,
                "architecture_complexity": 6.8
            }
        }
    
    @staticmethod
    def get_all_demos() -> List[Dict[str, Any]]:
        """Get all demo repositories"""
        return [
            DemoRepository.get_enterprise_ecommerce(),
            DemoRepository.get_fintech_platform(),
            DemoRepository.get_social_media_app()
        ]
    
    @staticmethod
    def get_demo_by_name(name: str) -> Dict[str, Any]:
        """Get specific demo by name"""
        demos = {
            "enterprise-ecommerce": DemoRepository.get_enterprise_ecommerce(),
            "fintech-platform": DemoRepository.get_fintech_platform(),
            "social-media-app": DemoRepository.get_social_media_app()
        }
        return demos.get(name, DemoRepository.get_enterprise_ecommerce())

# Made with Bob