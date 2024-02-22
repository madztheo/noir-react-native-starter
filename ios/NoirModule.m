//
//  NoirModule.m
//  NoirReactNative
//
//  Created by Theo Madzou on 21/02/2024.
//

#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(NoirModule, NSObject)

RCT_EXTERN_METHOD(prove:(NSDictionary)inputs
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(verify:(NSString)proof
                  vkey:(NSString)vkey
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

@end
