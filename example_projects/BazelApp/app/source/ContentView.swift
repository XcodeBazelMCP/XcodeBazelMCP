import CoreLocation
import os.log
import SwiftUI

private let logger = Logger(subsystem: "com.example.SwiftUIApp", category: "UI")

final class LocationManager: NSObject, ObservableObject, CLLocationManagerDelegate {
    private let manager = CLLocationManager()

    @Published var latitude: Double?
    @Published var longitude: Double?
    @Published var status: String = "Waiting..."

    override init() {
        super.init()
        manager.delegate = self
        manager.desiredAccuracy = kCLLocationAccuracyBest
        manager.requestWhenInUseAuthorization()
        manager.startUpdatingLocation()
    }

    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let loc = locations.last else { return }
        latitude = loc.coordinate.latitude
        longitude = loc.coordinate.longitude
        status = "Updated"
    }

    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        status = "Error: \(error.localizedDescription)"
    }

    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        switch manager.authorizationStatus {
        case .authorizedWhenInUse, .authorizedAlways:
            manager.startUpdatingLocation()
            status = "Authorized"
        case .denied, .restricted:
            status = "Denied"
        case .notDetermined:
            status = "Not determined"
        @unknown default:
            status = "Unknown"
        }
    }
}

struct ContentView: View {
    @StateObject private var location = LocationManager()
    @Environment(\.colorScheme) private var colorScheme
    @State private var tapCount = 0
    @State private var selectedItems: Set<Int> = []

    private let scrollItems = (1...30).map { "Item \($0)" }

    private var launchArgs: [String] {
        ProcessInfo.processInfo.arguments.filter { $0.hasPrefix("--") }
    }

    private var envVars: [(String, String)] {
        let env = ProcessInfo.processInfo.environment
        return ["MCP_DEMO", "APP_MODE", "FEATURE_FLAG"].compactMap { key in
            env[key].map { (key, $0) }
        }
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                headerSection
                tapButtonSection
                scrollListSection
                locationSection
                appearanceSection
                if !launchArgs.isEmpty { launchArgsSection }
                if !envVars.isEmpty { envVarsSection }
                hintSection
            }
            .padding()
        }
    }

    private var headerSection: some View {
        VStack(spacing: 8) {
            Image(systemName: "hammer.fill")
                .font(.system(size: 48))
                .foregroundColor(.accentColor)
            Text("XcodeBazelMCP")
                .font(.largeTitle).bold()
            Text("Demo App")
                .font(.subheadline)
                .foregroundColor(.secondary)
        }
    }

    private var tapButtonSection: some View {
        CardView(title: "Tap Test", icon: "hand.tap.fill") {
            Text("Tapped \(tapCount) time\(tapCount == 1 ? "" : "s")")
                .font(.system(.body, design: .monospaced))
                .accessibilityIdentifier("tapCountLabel")
            Button(action: {
                tapCount += 1
                print("[TapTest] Button tapped! Count is now \(tapCount)")
                logger.notice("Button tapped! Count is now \(self.tapCount)")
            }) {
                Label("Tap Me", systemImage: "hand.point.up.left.fill")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.borderedProminent)
            .accessibilityIdentifier("tapMeButton")
        }
    }

    private var scrollListSection: some View {
        CardView(title: "Scroll Test", icon: "list.bullet") {
            VStack(spacing: 0) {
                ForEach(Array(scrollItems.enumerated()), id: \.offset) { index, item in
                    let itemNumber = index + 1
                    Button(action: {
                        if selectedItems.contains(itemNumber) {
                            selectedItems.remove(itemNumber)
                        } else {
                            selectedItems.insert(itemNumber)
                        }
                        print("[ScrollTest] Tapped \(item)")
                        logger.notice("Tapped \(item), selected=\(selectedItems.contains(itemNumber))")
                    }) {
                        HStack {
                            Text(item)
                                .font(.system(.body, design: .monospaced))
                                .foregroundColor(.primary)
                            Spacer()
                            if selectedItems.contains(itemNumber) {
                                Image(systemName: "checkmark.circle.fill")
                                    .foregroundColor(.accentColor)
                            }
                        }
                        .padding(.vertical, 10)
                        .padding(.horizontal, 4)
                    }
                    .accessibilityIdentifier("scrollItem_\(itemNumber)")
                    .onAppear {
                        logger.notice("Item \(itemNumber) appeared on screen")
                    }
                    if index < scrollItems.count - 1 {
                        Divider()
                    }
                }
            }
            Text("\(selectedItems.count) selected")
                .font(.caption)
                .foregroundColor(.secondary)
                .accessibilityIdentifier("selectedCount")
        }
    }

    private var locationSection: some View {
        CardView(title: "GPS Location", icon: "location.fill") {
            if let lat = location.latitude, let lng = location.longitude {
                MonoRow(label: "Lat", value: String(format: "%.4f", lat))
                MonoRow(label: "Lng", value: String(format: "%.4f", lng))
            } else {
                Text("No location yet").foregroundColor(.secondary)
            }
            Text("Status: \(location.status)")
                .font(.caption).foregroundColor(.secondary)
        }
    }

    private var appearanceSection: some View {
        CardView(title: "Appearance", icon: "circle.lefthalf.filled") {
            HStack {
                Image(systemName: colorScheme == .dark ? "moon.fill" : "sun.max.fill")
                    .foregroundColor(colorScheme == .dark ? .yellow : .orange)
                Text(colorScheme == .dark ? "Dark Mode" : "Light Mode")
                    .font(.system(.body, design: .monospaced))
            }
        }
    }

    private var launchArgsSection: some View {
        CardView(title: "Launch Args", icon: "terminal") {
            ForEach(launchArgs, id: \.self) { arg in
                Text(arg).font(.system(.caption, design: .monospaced))
            }
        }
    }

    private var envVarsSection: some View {
        CardView(title: "Env Vars", icon: "key") {
            ForEach(envVars, id: \.0) { key, value in
                MonoRow(label: key, value: value)
            }
        }
    }

    private var hintSection: some View {
        VStack(spacing: 4) {
            Text("Try these XcodeBazelMCP commands:")
                .font(.caption).foregroundColor(.secondary)
            Group {
                Text("sim-location --latitude 48.8566 --longitude 2.3522")
                Text("sim-appearance --appearance dark")
                Text("launch com.example.SwiftUIApp --launch-arg --mock-api")
            }
            .font(.system(.caption2, design: .monospaced))
            .foregroundColor(.secondary)
        }
        .padding(.top, 8)
    }
}

struct CardView<Content: View>: View {
    let title: String
    let icon: String
    @ViewBuilder let content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Label(title, systemImage: icon)
                .font(.headline)
            content
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(RoundedRectangle(cornerRadius: 12).fill(.ultraThinMaterial))
    }
}

struct MonoRow: View {
    let label: String
    let value: String

    var body: some View {
        HStack {
            Text(label).foregroundColor(.secondary)
            Spacer()
            Text(value).font(.system(.body, design: .monospaced))
        }
    }
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
    }
}
