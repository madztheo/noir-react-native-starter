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
                  recursive:(BOOL)recursive
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(prove:(NSDictionary)inputs
                  circuitId:(NSString)circuitId
                  proofType:(NSString)proofType
                  recursive:(BOOL)recursive
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(verify:(NSString)proof
                  vkey:(NSString)vkey
                  circuitId:(NSString)circuitData
                  proofType:(NSString)proofType
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
