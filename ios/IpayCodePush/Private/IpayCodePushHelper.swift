//
//  IpayCodePushHelper.swift
//  InstantpayCodePush
//
//  Created by Dhananjay kumar on 06/02/26.
//
import os

@objcMembers public class IpayCodePushHelper {
    
    private init() {}
    
    static let MAIN_LOG_TAG: String = "*IpayCodePush -> ";
    
    let WARNING_LOG = "WARNING_LOG"

    let ERROR_LOG = "ERROR_LOG"
    
    static func logPrint(classTag: String, log: String?) -> Void {
        if(log == nil){
            return
        }
        
        let fullTagName = "\(MAIN_LOG_TAG) \(classTag) \(String(describing: log))"
        
        if let isEnableLog: Bool = Bundle.main.object(forInfoDictionaryKey: "IpayCodePush_Log") as! Bool? {
            if(isEnableLog){
                let logger = Logger(subsystem: "com.instantpay.ipayCodePush", category: "IpayCodePushHelper")
                logger.info("\(fullTagName)")
            }
        }
    }
    
    static func logPrint(logType: String, classTag: String, log: String?){
        if(log == nil){
            return
        }
        
        let fullTagName = "\(MAIN_LOG_TAG) \(classTag) \(String(describing: log))"
        
        if let isEnableLog: Bool = Bundle.main.object(forInfoDictionaryKey: "IpayCodePush_Log") as! Bool? {
            if(isEnableLog){
                let logger = Logger(subsystem: "com.instantpay.ipayCodePush", category: "IpayCodePushHelper")
                if(logType == "WARNING_LOG"){
                    logger.warning("\(fullTagName)")
                }
                else if(logType == "ERROR_LOG"){
                    logger.error("\(fullTagName)")
                }
                else{
                    logger.info("\(fullTagName)")
                }
            }
        }
    }
    
}
