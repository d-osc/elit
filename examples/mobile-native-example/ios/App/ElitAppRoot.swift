import SwiftUI

struct ElitAppRoot: View {
    var body: some View {
        Group {
            if ELIT_USE_NATIVE_UI {
                ElitGeneratedScreen()
            } else if let webURL = Bundle.main.url(forResource: "index", withExtension: "html", subdirectory: "www") {
                ElitWebView(url: webURL)
                    .ignoresSafeArea()
            } else {
                VStack(alignment: .leading, spacing: 12) {
                    Text("Elit web bundle not found.")
                    Text("Run elit mobile sync after building your web app.")
                        .foregroundStyle(.secondary)
                }
                .padding(24)
            }
        }
    }
}
