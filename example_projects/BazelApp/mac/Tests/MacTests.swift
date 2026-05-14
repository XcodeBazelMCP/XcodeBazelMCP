@testable import MacApp
import XCTest

final class MacTests: XCTestCase {
    func test_macContentViewExists() {
        let view = MacContentView()
        XCTAssertNotNil(view)
    }
}
