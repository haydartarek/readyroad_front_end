plugins {
    id("com.android.application")
    id("kotlin-android")
    id("dev.flutter.flutter-gradle-plugin")
}

flutter {
    source = "../.."
}

// Supply upload-key credentials locally; never fall back to a debug certificate.
val uploadStorePath = providers.environmentVariable("RIJVIA_ANDROID_KEYSTORE_PATH").orNull
val uploadStorePassword = providers.environmentVariable("RIJVIA_ANDROID_STORE_PASSWORD").orNull
val uploadKeyAlias = providers.environmentVariable("RIJVIA_ANDROID_KEY_ALIAS").orNull
val uploadKeyPassword = providers.environmentVariable("RIJVIA_ANDROID_KEY_PASSWORD").orNull
val uploadSigningReady = listOf(uploadStorePath, uploadStorePassword, uploadKeyAlias, uploadKeyPassword)
    .all { !it.isNullOrBlank() } && file(uploadStorePath ?: ".").isFile

gradle.taskGraph.whenReady {
    if (allTasks.any { it.name.contains("Release", ignoreCase = true) } && !uploadSigningReady) {
        throw GradleException("Rijvia release requires the four RIJVIA_ANDROID signing environment variables and a valid upload keystore. Debug signing is not permitted for release.")
    }
}

android {
    namespace = "com.readyroad.mobile_app"
    compileSdk = 36
    ndkVersion = flutter.ndkVersion

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = JavaVersion.VERSION_17.toString()
    }

    defaultConfig {
        applicationId = "com.readyroad.mobile_app"
        minSdk = flutter.minSdkVersion
        targetSdk = 36
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    signingConfigs {
        if (uploadSigningReady) {
            create("release") {
                storeFile = file(uploadStorePath!!)
                storePassword = uploadStorePassword
                keyAlias = uploadKeyAlias
                keyPassword = uploadKeyPassword
            }
        }
    }

    buildTypes {
        release {
            signingConfig = signingConfigs.findByName("release")
        }
    }
}
