/*
 * Copyright (C) 2012 Soomla Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#import "MuffinRushAssets.h"
#import "VirtualCategory.h"
#import "VirtualCurrency.h"
#import "VirtualGood.h"
#import "VirtualCurrencyPack.h"
#import "StaticPriceModel.h"

NSString* const MUFFIN_CURRENCY_ITEM_ID      = @"currency_muffin";
NSString* const TENMUFF_PACK_PRODUCT_ID      = @"";
NSString* const FIFTYMUFF_PACK_PRODUCT_ID    = @"";
NSString* const FORTYMUFF_PACK_PRODUCT_ID    = @"com.soomla.SoomlaiOSStoreExampleDevice.test_product_one";
NSString* const THOUSANDMUFF_PACK_PRODUCT_ID = @"com.soomla.SoomlaiOSStoreExampleDevice.second_test";

@implementation MuffinRushAssets

VirtualCategory* GENERAL_CATEGORY;
VirtualCurrency* MUFFIN_CURRENCY;
VirtualGood*     MUFFINCAKE_GOOD;
VirtualGood*     PAVLOVA_GOOD;
VirtualGood*     CHOCLATECAKE_GOOD;
VirtualGood*     CREAMCUP_GOOD;
VirtualCurrencyPack* TENMUFF_PACK;
VirtualCurrencyPack* FIFTYMUFF_PACK;
VirtualCurrencyPack* FORTYMUFF_PACK;
VirtualCurrencyPack* THOUSANDMUFF_PACK;
+ (void)initialize{
    
    /** Virtual Categories **/
    // The muffin rush theme doesn't support categories, so we just put everything under a general category.
    
    GENERAL_CATEGORY = [[VirtualCategory alloc] initWithName:@"General"
                                                       andId:0];
    
    /** Virtual Currencies **/
    
    MUFFIN_CURRENCY = [[VirtualCurrency alloc] initWithName:@"Muffins"
                                             andDescription:@""
                                                  andItemId:MUFFIN_CURRENCY_ITEM_ID];
    
    
    /** Virtual Goods **/
    
    NSDictionary* MUFFINCAKE_PRICE = [[NSDictionary alloc] initWithObjectsAndKeys:
                                      [NSNumber numberWithInt:225], MUFFIN_CURRENCY_ITEM_ID,
                                      nil];
    MUFFINCAKE_GOOD = [[VirtualGood alloc] initWithName:@"Fruit Cake"
                                         andDescription:@"Customers buy a double portion on each purchase of this cake"
                                              andItemId:@"fruit_cake"
                                          andPriceModel:[[StaticPriceModel alloc] initWithCurrencyValue:MUFFINCAKE_PRICE]
                                            andCategory:GENERAL_CATEGORY
                                         andEquipStatus:NO];
    
    NSDictionary* PAVLOVA_PRICE = [[NSDictionary alloc] initWithObjectsAndKeys:
                                      [NSNumber numberWithInt:175], MUFFIN_CURRENCY_ITEM_ID,
                                      nil];
    PAVLOVA_GOOD = [[VirtualGood alloc] initWithName:@"Pavlova"
                                         andDescription:@"Gives customers a sugar rush and they call their friends"
                                              andItemId:@"pavlova"
                                          andPriceModel:[[StaticPriceModel alloc] initWithCurrencyValue:PAVLOVA_PRICE]
                                            andCategory:GENERAL_CATEGORY
                                         andEquipStatus:NO];
    
    NSDictionary* CHOCLATECAKE_PRICE = [[NSDictionary alloc] initWithObjectsAndKeys:
                                   [NSNumber numberWithInt:250], MUFFIN_CURRENCY_ITEM_ID,
                                   nil];
    CHOCLATECAKE_GOOD = [[VirtualGood alloc] initWithName:@"Chocolate Cake"
                                      andDescription:@"A classic cake to maximize customer satisfaction"
                                           andItemId:@"chocolate_cake"
                                       andPriceModel:[[StaticPriceModel alloc] initWithCurrencyValue:CHOCLATECAKE_PRICE]
                                         andCategory:GENERAL_CATEGORY
                                      andEquipStatus:NO];
    

    NSDictionary* CREAMCUP_PRICE = [[NSDictionary alloc] initWithObjectsAndKeys:
                                        [NSNumber numberWithInt:50], MUFFIN_CURRENCY_ITEM_ID,
                                        nil];
    CREAMCUP_GOOD = [[VirtualGood alloc] initWithName:@"Cream Cup"
                                           andDescription:@"Increase bakery reputation with this original pastry"
                                                andItemId:@"cream_cup"
                                            andPriceModel:[[StaticPriceModel alloc] initWithCurrencyValue:CREAMCUP_PRICE]
                                              andCategory:GENERAL_CATEGORY
                                           andEquipStatus:NO];
    
    
    /** Virtual Currency Pack **/
    
    TENMUFF_PACK = [[VirtualCurrencyPack alloc] initWithName:@"10 Muffins"
                                              andDescription:@" (refund test)"
                                                   andItemId:@"muffins_10"
                                                    andPrice:0.99
                                                andProductId:TENMUFF_PACK_PRODUCT_ID
                                           andCurrencyAmount:10
                                                 andCurrency:MUFFIN_CURRENCY];
    FIFTYMUFF_PACK = [[VirtualCurrencyPack alloc] initWithName:@"50 Muffins"
                                                andDescription:@" (canceled test)"
                                                     andItemId:@"muffins_50"
                                                      andPrice:1.99
                                                  andProductId:FIFTYMUFF_PACK_PRODUCT_ID
                                             andCurrencyAmount:50 andCurrency:MUFFIN_CURRENCY];
    FORTYMUFF_PACK = [[VirtualCurrencyPack alloc] initWithName:@"400 Muffins"
                                                andDescription:@"ONLY THIS WORKS IN THIS EXAMPLE (purchase test)"
                                                     andItemId:@"muffins_400"
                                                      andPrice:4.99
                                                  andProductId:FORTYMUFF_PACK_PRODUCT_ID
                                             andCurrencyAmount:400
                                                   andCurrency:MUFFIN_CURRENCY];
    THOUSANDMUFF_PACK = [[VirtualCurrencyPack alloc] initWithName:@"1000 Muffins"
                                                   andDescription:@" (item_unavailable test)"
                                                        andItemId:@"muffins_1000"
                                                         andPrice:8.99
                                                     andProductId:THOUSANDMUFF_PACK_PRODUCT_ID
                                                andCurrencyAmount:1000
                                                      andCurrency:MUFFIN_CURRENCY];
    
}

- (NSArray*)virtualCurrencies{
    return @[MUFFIN_CURRENCY];
}

- (NSArray*)virtualGoods{
    return @[MUFFINCAKE_GOOD, PAVLOVA_GOOD, CHOCLATECAKE_GOOD, CREAMCUP_GOOD];
}

- (NSArray*)virtualCurrencyPacks{
    return @[TENMUFF_PACK, FIFTYMUFF_PACK, FORTYMUFF_PACK, THOUSANDMUFF_PACK];
}

- (NSArray*)virtualCategories{
    return @[GENERAL_CATEGORY];
}

@end
