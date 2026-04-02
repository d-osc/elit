package com.elit.mobileexample
// ELIT-MOBILE-MAIN-ACTIVITY
import android.annotation.SuppressLint
import android.os.Bundle
import android.webkit.WebSettings
import android.webkit.WebView
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView
class MainActivity : ComponentActivity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setContent {
      ElitAppRoot()
    }
  }
}
@Composable
private fun ElitAppRoot() {
  if (ELIT_USE_NATIVE_UI) {
    ElitGeneratedScreen()
    return
  }
  ElitWebView(modifier = Modifier.fillMaxSize())
}
@SuppressLint("SetJavaScriptEnabled")
@Composable
private fun ElitWebView(modifier: Modifier = Modifier) {
  AndroidView(
    modifier = modifier,
    factory = { context ->
      WebView(context).apply {
        val webSettings: WebSettings = settings
        webSettings.javaScriptEnabled = true
        webSettings.domStorageEnabled = true
        loadUrl("file:///android_asset/public/index.html")
      }
    },
  )
}