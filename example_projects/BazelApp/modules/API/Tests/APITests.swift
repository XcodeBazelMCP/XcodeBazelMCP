import API
import Testing

struct APITests {
    @Test func success() {
        #expect(API.returnTrue())
    }
}
