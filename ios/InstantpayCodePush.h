#import <InstantpayCodePushSpec/InstantpayCodePushSpec.h>
#import <React/RCTEventEmitter.h>
#import <React/RCTBundleURLProvider.h>

@interface InstantpayCodePush : RCTEventEmitter <NativeInstantpayCodePushSpec>

/**
 * Returns the currently active bundle URL from the default (static) instance.
 * Callable from Objective-C (e.g., AppDelegate).
 * This is implemented in InstantpayCodePush.mm and calls the Swift static method.
 */
+ (NSURL *)bundleURL;

/**
 * Returns the currently active bundle URL with specific bundle from the default (static) instance.
 * Callable from Objective-C (e.g., AppDelegate).
 * This is implemented in InstantpayCodePush.mm and calls the Swift static method.
 */
+ (NSURL *)bundleURLWithBundle:(NSBundle *)bundle NS_SWIFT_NAME(bundleURL(bundle:));

/**
 * Returns the bundle URL for this specific instance.
 * @return The bundle URL for this instance
 */
- (NSURL *)bundleURL;

/**
 * Returns the bundle URL with specific bundle for this specific instance.
 * @return The bundle URL for this instance
 */
- (NSURL *)bundleURLWithBundle:(NSBundle *)bundle NS_SWIFT_NAME(bundleURL(bundle:));

/**
 * 다운로드 진행 상황 업데이트 시간을 추적하는 속성
 */
@property (nonatomic, assign) NSTimeInterval lastUpdateTime;

// No need to declare the exported methods (reload, etc.) here
// as RCT_EXPORT_METHOD handles their exposure to JavaScript.
// We also don't need to declare supportedEvents or requiresMainQueueSetup here
// as they are implemented in the .mm file (calling Swift).

@end
