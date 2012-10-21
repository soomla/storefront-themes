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
#import "TempleRunAssets.h"
#import "VirtualCategory.h"
#import "VirtualCurrency.h"
#import "VirtualGood.h"
#import "VirtualCurrencyPack.h"
#import "StaticPriceModel.h"


NSString* const COINS_CURRENCY_ITEM_ID = @"currency_muffin";

NSString* const BOOST_AHEAD_GOOD_ITEM_ID = @"boost_ahead";
NSString* const EXTRA_HEALTH_GOOD_ITEM_ID = @"extra_health";
NSString* const INVISIBILITY_HAT_GOOD_ITEM_ID = @"invisibility_hat";
NSString* const HORN_OF_WAR_GOOD_ITEM_ID = @"horn_of_war";
NSString* const FLAGSHIP_GOOD_ITEM_ID = @"flagship";
NSString* const MYSTERY_BOX_GOOD_ITEM_ID = @"mystery_box";
NSString* const WISDOM_GOD_GOOD_ITEM_ID = @"science_god";
NSString* const WIND_GOD_GOOD_ITEM_ID = @"wind_god";
NSString* const WINTER_GOD_GOOD_ITEM_ID = @"winter_god";
NSString* const STARS_GOD_GOOD_ITEM_ID = @"stars_god";
NSString* const ARGRICULTURE_GOD_GOOD_ITEM_ID = @"chocolate_cake";
NSString* const EAGLE_GOOD_ITEM_ID = @"eagle";
NSString* const BUTTERFLY_GOOD_ITEM_ID = @"butterfly";
NSString* const FISH_GOOD_ITEM_ID = @"fish";

NSString* const _2_500_COINS_PACK_ITEM_ID = @"muffins_10";
NSString* const _25_000_COINS_PACK_ITEM_ID = @"muffins_50";
NSString* const _75_000_COINS_PACK_ITEM_ID = @"muffins_400";
NSString* const _200_000_COINS_PACK_ITEM_ID = @"muffins_1000";

NSString* const _2_500_COINS_PACK_PRODUCT_ID = @"2500_coins";
NSString* const _25_000_COINS_PACK_PRODUCT_ID = @"android.test.purchased";
NSString* const _75_000_COINS_PACK_PRODUCT_ID = @"75000_coins";
NSString* const _200_000_COINS_PACK_PRODUCT_ID = @"200000_coins";

@implementation TempleRunAssets


VirtualCategory* POWERUPS_CATEGORY;
VirtualCategory* UTILITIES_CATEGORY;
VirtualCategory* GODS_CATEGORY;
VirtualCategory* FRIENDS_CATEGORY;

VirtualCurrency* COINS_CURRENCY;

VirtualGood* BOOST_AHEAD_GOOD;
VirtualGood* EXTRA_HEALTH_GOOD;
VirtualGood* INVISIBILITY_HAT_GOOD;
VirtualGood* HORN_OF_WAR_GOOD;
VirtualGood* FLAGSHIP_GOOD;
VirtualGood* MYSTERY_BOX_GOOD;
VirtualGood* WISDOM_GOD_GOOD;
VirtualGood* WIND_GOD_GOOD;
VirtualGood* WINTER_GOD_GOOD;
VirtualGood* STARS_GOD_GOOD;
VirtualGood* ARGRICULTURE_GOD_GOOD;
VirtualGood* EAGLE_GOOD;
VirtualGood* BUTTERFLY_GOOD;
VirtualGood* FISH_GOOD;

VirtualCurrencyPack* _2_500_COINS_PACK;
VirtualCurrencyPack* _25_000_COINS_PACK;
VirtualCurrencyPack* _75_000_COINS_PACK;
VirtualCurrencyPack* _200_000_COINS_PACK;
+ (void)initialize{

    /** Virtual Categories **/
    
    POWERUPS_CATEGORY = [[VirtualCategory alloc] initWithName:@"POWERUPS"
                                    andId:1];
    UTILITIES_CATEGORY = [[VirtualCategory alloc] initWithName:@"UTILITIES"
                                    andId:2];
    GODS_CATEGORY = [[VirtualCategory alloc] initWithName:@"GODS"
                                    andId:3];
    FRIENDS_CATEGORY = [[VirtualCategory alloc] initWithName:@"FRIENDS"
                                    andId:4];


    /** Virtual Currencies **/

    
    COINS_CURRENCY = [[VirtualCurrency alloc] initWithName:@"Coins"
                           andDescription:@""
                                andItemId:COINS_CURRENCY_ITEM_ID];


    /** Virtual Goods **/

    
    NSDictionary* BOOST_AHEAD_PRICE = [[NSDictionary alloc] initWithObjectsAndKeys:
                                      [NSNumber numberWithInt:250], COINS_CURRENCY_ITEM_ID,
                                      nil];
    BOOST_AHEAD_GOOD = [[VirtualGood alloc] initWithName:@"Boost Ahead"
                          andDescription:@"Get a head start of 100 miles"
                               andItemId:@"boost_ahead"
                           andPriceModel:[[StaticPriceModel alloc] initWithCurrencyValue:BOOST_AHEAD_PRICE]
                             andCategory:POWERUPS_CATEGORY
                          andEquipStatus:NO];

    NSDictionary* EXTRA_HEALTH_PRICE = [[NSDictionary alloc] initWithObjectsAndKeys:
                                      [NSNumber numberWithInt:500], COINS_CURRENCY_ITEM_ID,
                                      nil];
    EXTRA_HEALTH_GOOD = [[VirtualGood alloc] initWithName:@"Extra Health"
                          andDescription:@"Find hearts in the game to recover your health points"
                               andItemId:@"extra_health"
                           andPriceModel:[[StaticPriceModel alloc] initWithCurrencyValue:EXTRA_HEALTH_PRICE]
                             andCategory:POWERUPS_CATEGORY
                          andEquipStatus:NO];

    NSDictionary* INVISIBILITY_HAT_PRICE = [[NSDictionary alloc] initWithObjectsAndKeys:
                                      [NSNumber numberWithInt:750], COINS_CURRENCY_ITEM_ID,
                                      nil];
    INVISIBILITY_HAT_GOOD = [[VirtualGood alloc] initWithName:@"Invisibility Hat"
                          andDescription:@"Find the invisibility hat to suprise your enemies"
                               andItemId:@"invisibility_hat"
                           andPriceModel:[[StaticPriceModel alloc] initWithCurrencyValue:INVISIBILITY_HAT_PRICE]
                             andCategory:POWERUPS_CATEGORY
                          andEquipStatus:NO];

    NSDictionary* HORN_OF_WAR_PRICE = [[NSDictionary alloc] initWithObjectsAndKeys:
                                      [NSNumber numberWithInt:500], COINS_CURRENCY_ITEM_ID,
                                      nil];
    HORN_OF_WAR_GOOD = [[VirtualGood alloc] initWithName:@"Horn of War"
                          andDescription:@"Pass the word to your fleet quicker"
                               andItemId:@"horn_of_war"
                           andPriceModel:[[StaticPriceModel alloc] initWithCurrencyValue:HORN_OF_WAR_PRICE]
                             andCategory:UTILITIES_CATEGORY
                          andEquipStatus:NO];

    NSDictionary* FLAGSHIP_PRICE = [[NSDictionary alloc] initWithObjectsAndKeys:
                                      [NSNumber numberWithInt:1000], COINS_CURRENCY_ITEM_ID,
                                      nil];
    FLAGSHIP_GOOD = [[VirtualGood alloc] initWithName:@"Flagship"
                          andDescription:@"Use the power of the wind to move faster"
                               andItemId:@"flagship"
                           andPriceModel:[[StaticPriceModel alloc] initWithCurrencyValue:FLAGSHIP_PRICE]
                             andCategory:UTILITIES_CATEGORY
                          andEquipStatus:NO];

    NSDictionary* MYSTERY_BOX_PRICE = [[NSDictionary alloc] initWithObjectsAndKeys:
                                      [NSNumber numberWithInt:2000], COINS_CURRENCY_ITEM_ID,
                                      nil];
    MYSTERY_BOX_GOOD = [[VirtualGood alloc] initWithName:@"Mystery Box"
                          andDescription:@"Special utility that will be revealed once you open the box"
                               andItemId:@"mystery_box"
                           andPriceModel:[[StaticPriceModel alloc] initWithCurrencyValue:MYSTERY_BOX_PRICE]
                             andCategory:UTILITIES_CATEGORY
                          andEquipStatus:NO];

    NSDictionary* WISDOM_GOD_PRICE = [[NSDictionary alloc] initWithObjectsAndKeys:
                                      [NSNumber numberWithInt:10000], COINS_CURRENCY_ITEM_ID,
                                      nil];
    WISDOM_GOD_GOOD = [[VirtualGood alloc] initWithName:@"Wisdom God"
                          andDescription:@"Fight in the name of Wisdom God and get more powerful weapons"
                               andItemId:@"science_god"
                           andPriceModel:[[StaticPriceModel alloc] initWithCurrencyValue:WISDOM_GOD_PRICE]
                             andCategory:GODS_CATEGORY
                          andEquipStatus:NO];

    NSDictionary* WIND_GOD_PRICE = [[NSDictionary alloc] initWithObjectsAndKeys:
                                      [NSNumber numberWithInt:10000], COINS_CURRENCY_ITEM_ID,
                                      nil];
    WIND_GOD_GOOD = [[VirtualGood alloc] initWithName:@"Wind God"
                          andDescription:@"Fight in the name of the Wind God and the wind will always be at your side"
                               andItemId:@"wind_god"
                           andPriceModel:[[StaticPriceModel alloc] initWithCurrencyValue:WIND_GOD_PRICE]
                             andCategory:GODS_CATEGORY
                          andEquipStatus:NO];

    NSDictionary* WINTER_GOD_PRICE = [[NSDictionary alloc] initWithObjectsAndKeys:
                                      [NSNumber numberWithInt:10000], COINS_CURRENCY_ITEM_ID,
                                      nil];
    WINTER_GOD_GOOD = [[VirtualGood alloc] initWithName:@"Winter God"
                          andDescription:@"Fight in the name of the Winter God and avoid glaciers and frost"
                               andItemId:@"winter_god"
                           andPriceModel:[[StaticPriceModel alloc] initWithCurrencyValue:WINTER_GOD_PRICE]
                             andCategory:GODS_CATEGORY
                          andEquipStatus:NO];

    NSDictionary* STARS_GOD_PRICE = [[NSDictionary alloc] initWithObjectsAndKeys:
                                      [NSNumber numberWithInt:10000], COINS_CURRENCY_ITEM_ID,
                                      nil];
    STARS_GOD_GOOD = [[VirtualGood alloc] initWithName:@"Stars God"
                          andDescription:@"Fight in the name of the Stars God and never be lost"
                               andItemId:@"stars_god"
                           andPriceModel:[[StaticPriceModel alloc] initWithCurrencyValue:STARS_GOD_PRICE]
                             andCategory:GODS_CATEGORY
                          andEquipStatus:NO];

    NSDictionary* ARGRICULTURE_GOD_PRICE = [[NSDictionary alloc] initWithObjectsAndKeys:
                                      [NSNumber numberWithInt:10000], COINS_CURRENCY_ITEM_ID,
                                      nil];
    ARGRICULTURE_GOD_GOOD = [[VirtualGood alloc] initWithName:@"Argriculture God"
                          andDescription:@"Fight in the name of Agriculture God and never run out of food"
                               andItemId:@"chocolate_cake"
                           andPriceModel:[[StaticPriceModel alloc] initWithCurrencyValue:ARGRICULTURE_GOD_PRICE]
                             andCategory:GODS_CATEGORY
                          andEquipStatus:NO];

    NSDictionary* EAGLE_PRICE = [[NSDictionary alloc] initWithObjectsAndKeys:
                                      [NSNumber numberWithInt:5000], COINS_CURRENCY_ITEM_ID,
                                      nil];
    EAGLE_GOOD = [[VirtualGood alloc] initWithName:@"Eagle"
                          andDescription:@"The eagle can tell you about enemies ahead of time up to 100 miles away"
                               andItemId:@"eagle"
                           andPriceModel:[[StaticPriceModel alloc] initWithCurrencyValue:EAGLE_PRICE]
                             andCategory:FRIENDS_CATEGORY
                          andEquipStatus:NO];

    NSDictionary* BUTTERFLY_PRICE = [[NSDictionary alloc] initWithObjectsAndKeys:
                                      [NSNumber numberWithInt:5000], COINS_CURRENCY_ITEM_ID,
                                      nil];
    BUTTERFLY_GOOD = [[VirtualGood alloc] initWithName:@"Butterfly"
                          andDescription:@"The butterfly can help you control your crew and protect against mutiny"
                               andItemId:@"butterfly"
                           andPriceModel:[[StaticPriceModel alloc] initWithCurrencyValue:BUTTERFLY_PRICE]
                             andCategory:FRIENDS_CATEGORY
                          andEquipStatus:NO];

    NSDictionary* FISH_PRICE = [[NSDictionary alloc] initWithObjectsAndKeys:
                                      [NSNumber numberWithInt:5000], COINS_CURRENCY_ITEM_ID,
                                      nil];
    FISH_GOOD = [[VirtualGood alloc] initWithName:@"Fish"
                          andDescription:@"Fish can help you trick your enemy into a trap"
                               andItemId:@"fish"
                           andPriceModel:[[StaticPriceModel alloc] initWithCurrencyValue:FISH_PRICE]
                             andCategory:FRIENDS_CATEGORY
                          andEquipStatus:NO];



    /** Virtual Currency Pack **/

    
    _2_500_COINS_PACK = [[VirtualCurrencyPack alloc] initWithName:@"2,500 Coins"
                          andDescription:@""
                               andItemId:@"muffins_10"
                                andPrice:0.99
                            andProductId:_2_500_COINS_PACK_PRODUCT_ID
                       andCurrencyAmount:2500
                             andCurrency:COINS_CURRENCY];
    _25_000_COINS_PACK = [[VirtualCurrencyPack alloc] initWithName:@"25,000 Coins"
                          andDescription:@""
                               andItemId:@"muffins_50"
                                andPrice:4.99
                            andProductId:_25_000_COINS_PACK_PRODUCT_ID
                       andCurrencyAmount:25000
                             andCurrency:COINS_CURRENCY];
    _75_000_COINS_PACK = [[VirtualCurrencyPack alloc] initWithName:@"75,000 Coins"
                          andDescription:@""
                               andItemId:@"muffins_400"
                                andPrice:9.99
                            andProductId:_75_000_COINS_PACK_PRODUCT_ID
                       andCurrencyAmount:75000
                             andCurrency:COINS_CURRENCY];
    _200_000_COINS_PACK = [[VirtualCurrencyPack alloc] initWithName:@"200,000 Coins"
                          andDescription:@""
                               andItemId:@"muffins_1000"
                                andPrice:19.99
                            andProductId:_200_000_COINS_PACK_PRODUCT_ID
                       andCurrencyAmount:200000
                             andCurrency:COINS_CURRENCY];
}

- (NSArray*)virtualCurrencies{
    return @[COINS_CURRENCY];
}

- (NSArray*)virtualGoods{
    return @[BOOST_AHEAD_GOOD, EXTRA_HEALTH_GOOD, INVISIBILITY_HAT_GOOD, HORN_OF_WAR_GOOD, FLAGSHIP_GOOD, MYSTERY_BOX_GOOD, WISDOM_GOD_GOOD, WIND_GOD_GOOD, WINTER_GOD_GOOD, STARS_GOD_GOOD, ARGRICULTURE_GOD_GOOD, EAGLE_GOOD, BUTTERFLY_GOOD, FISH_GOOD];
}

- (NSArray*)virtualCurrencyPacks{
    return @[_2_500_COINS_PACK, _25_000_COINS_PACK, _75_000_COINS_PACK, _200_000_COINS_PACK];
}

- (NSArray*)virtualCategories{
    return @[POWERUPS_CATEGORY, UTILITIES_CATEGORY, GODS_CATEGORY, FRIENDS_CATEGORY];
}

@end

