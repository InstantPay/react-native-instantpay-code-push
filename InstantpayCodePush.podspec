require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "InstantpayCodePush"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => min_ios_version_supported }
  s.source       = { :git => "https://github.com/InstantPay/react-native-instantpay-code-push.git", :tag => "#{s.version}" }

  s.source_files = "ios/**/*.{h,m,mm,swift,cpp}"
  #s.private_header_files = "ios/**/*.h"
  s.public_header_files = "ios/IpayCodePush/Public/*.h"
  s.private_header_files = "ios/IpayCodePush/Private/*.h"

  s.pod_target_xcconfig = {
    "DEFINES_MODULE" => "YES",
    "OTHER_SWIFT_FLAGS" => "-enable-experimental-feature AccessLevelOnImport"
  }

  # SWCompression dependency for ZIP/TAR/GZIP/Brotli extraction support
  # Native Compression framework is used for GZIP and Brotli decompression
  s.dependency "SWCompression", "~> 4.8.0"

  install_modules_dependencies(s)
end
