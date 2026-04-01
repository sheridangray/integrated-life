import XCTest
@testable import IntegratedLife

final class PillarOrderStoreTests: XCTestCase {
    
    // MARK: - Helpers
    
    private var savedOrder: [String]?
    
    override func setUp() {
        super.setUp()
        // Clear any existing order
        UserDefaults.standard.removeObject(forKey: "pillars.order")
    }
    
    override func tearDown() {
        // Restore any saved state if needed
        if let order = savedOrder {
            UserDefaults.standard.set(order, forKey: "pillars.order")
        }
        super.tearDown()
    }
    
    // MARK: - loadOrder Tests
    
    func testLoadOrder_returnsAllPillars_whenNoSavedOrder() {
        // When no order is saved, should return all pillars in default order
        let order = PillarOrderStore.loadOrder()
        
        XCTAssertEqual(order.count, Pillar.allCases.count, "Should have all pillars")
        XCTAssertEqual(Set(order), Set(Pillar.allCases), "Should contain all pillars")
    }
    
    func testLoadOrder_preservesSavedOrder() {
        // Given: A saved order with Sleep first
        let customOrder = ["Sleep", "Health", "Time"]
        UserDefaults.standard.set(customOrder, forKey: "pillars.order")
        
        // When: Loading order
        let order = PillarOrderStore.loadOrder()
        
        // Then: First three should match saved order
        XCTAssertEqual(order[0], .sleep, "Sleep should be first")
        XCTAssertEqual(order[1], .health, "Health should be second")
        XCTAssertEqual(order[2], .time, "Time should be third")
    }
    
    func testLoadOrder_dropsUnknownPillars() {
        // Given: A saved order with an unknown pillar
        let customOrder = ["Sleep", "UnknownPillar", "Health"]
        UserDefaults.standard.set(customOrder, forKey: "pillars.order")
        
        // When: Loading order
        let order = PillarOrderStore.loadOrder()
        
        // Then: Should not contain unknown pillar
        XCTAssertFalse(order.contains { $0.rawValue == "UnknownPillar" }, "Should not contain unknown pillars")
        XCTAssertTrue(order.contains(.sleep), "Should contain Sleep")
        XCTAssertTrue(order.contains(.health), "Should contain Health")
    }
    
    func testLoadOrder_dedupesDuplicates() {
        // Given: A saved order with duplicates
        let customOrder = ["Sleep", "Sleep", "Health", "Health"]
        UserDefaults.standard.set(customOrder, forKey: "pillars.order")
        
        // When: Loading order
        let order = PillarOrderStore.loadOrder()
        
        // Then: Should not have duplicates
        let sleepCount = order.filter { $0 == .sleep }.count
        let healthCount = order.filter { $0 == .health }.count
        XCTAssertEqual(sleepCount, 1, "Sleep should appear once")
        XCTAssertEqual(healthCount, 1, "Health should appear once")
    }
    
    func testLoadOrder_appendsNewPillars() {
        // Given: A saved order missing some pillars
        let customOrder = ["Sleep", "Health"]
        UserDefaults.standard.set(customOrder, forKey: "pillars.order")
        
        // When: Loading order
        let order = PillarOrderStore.loadOrder()
        
        // Then: Should have all pillars (missing ones appended)
        XCTAssertEqual(order.count, Pillar.allCases.count, "Should have all pillars")
        XCTAssertTrue(order.contains(.time), "Should contain Time (not in saved order)")
    }
    
    // MARK: - saveOrder Tests
    
    func testSaveOrder_persistsToUserDefaults() {
        // Given: A custom order
        let customOrder: [Pillar] = [.sleep, .time, .health]
        
        // When: Saving order
        PillarOrderStore.saveOrder(customOrder)
        
        // Then: Should be persisted
        let saved = UserDefaults.standard.array(forKey: "pillars.order") as? [String]
        XCTAssertEqual(saved, ["Sleep", "Time", "Health"], "Should persist raw values")
    }
    
    func testSaveOrder_loadOrderRoundTrip() {
        // Given: A custom order
        let customOrder: [Pillar] = [.money, .food, .sleep]
        
        // When: Save then load
        PillarOrderStore.saveOrder(customOrder)
        let loaded = PillarOrderStore.loadOrder()
        
        // Then: Should match
        XCTAssertEqual(loaded.prefix(3), customOrder, "Round-trip should preserve order")
    }
}
