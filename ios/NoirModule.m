//
//  NoirModule.m
//  NoirReactNative
//
//  Created by Theo Madzou on 21/02/2024.
//

#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(NoirModule, NSObject)

RCT_EXTERN_METHOD(setupCircuit:(NSString)circuitData
                  size:(NSInteger)size
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(prove:(NSDictionary)inputs
                  circuitId:(NSString)circuitId
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(verify:(NSString)proof
                  circuitId:(NSString)circuitId
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(execute:(NSDictionary)inputs
                  circuitId:(NSString)circuitId
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(clearCircuit:(NSString)circuitId
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(clearAllCircuits:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}


@end
