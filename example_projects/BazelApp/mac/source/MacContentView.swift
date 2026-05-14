import SwiftUI

struct MacContentView: View {
    @Environment(\.colorScheme) private var colorScheme

    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "hammer.fill")
                .font(.system(size: 48))
                .foregroundColor(.accentColor)
            Text("XcodeBazelMCP")
                .font(.largeTitle).bold()
            Text("macOS Demo App")
                .font(.subheadline)
                .foregroundColor(.secondary)

            HStack {
                Image(systemName: colorScheme == .dark ? "moon.fill" : "sun.max.fill")
                    .foregroundColor(colorScheme == .dark ? .yellow : .orange)
                Text(colorScheme == .dark ? "Dark Mode" : "Light Mode")
                    .font(.system(.body, design: .monospaced))
            }
            .padding()
            .background(RoundedRectangle(cornerRadius: 12).fill(.ultraThinMaterial))
        }
        .frame(minWidth: 400, minHeight: 300)
        .padding()
    }
}
