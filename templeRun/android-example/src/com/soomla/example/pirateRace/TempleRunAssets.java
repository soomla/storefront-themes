package com.soomla.example.pirateRace;

import com.soomla.store.IStoreAssets;
import com.soomla.store.domain.data.*;
import java.util.HashMap;

public class PirateRaceAssets implements IStoreAssets {

    @Override
    public VirtualCurrency[] getVirtualCurrencies(){
        return  new VirtualCurrency[] {
            COINS_CURRENCY
        };
    }

    @Override
    public VirtualGood[] getVirtualGoods(){
        return new VirtualGood[] {
            MEGA_COIN_GOOD, COIN_MAGNET_GOOD, INVISIBILITY_GOOD, TRIPLE_VALUE_GOOD, RESURRECTION_WINGS_GOOD, PERMANENT_WINGS_GOOD, BOOST_AHEAD_GOOD, MEGA_BOOST_GOOD, GUY_DANGEROUS_GOOD, SCARLETT_FOX_GOOD, BARRY_BONES_GOOD, KARMA_KIM_GOOD, MONTANA_SMITH_GOOD
        };
    }

    @Override
    public VirtualCurrencyPack[] getVirtualCurrencyPacks(){
        return new VirtualCurrencyPack[] {
            _2_500_PACK, _25_000_PACK, _75_000_PACK, _200_000_PACK
        };
    }

    @Override
    public VirtualCategory[] getVirtualCategories() {
        return new VirtualCategory[]{
            POWERUPS_CATEGORY, UTILITIES_CATEGORY, CHARACTERS_CATEGORY
        };
    }

    @Override
    public GoogleMarketItem[] getGoogleManagedItems() {
        return new GoogleMarketItem[0];
    }


    /** Static Final members **/
    
    public static final String COINS_CURRENCY_ITEM_ID = "currency_muffin";
 
    public static final String MEGA_COIN_GOOD_ITEM_ID = "mega_coin";
    public static final String COIN_MAGNET_GOOD_ITEM_ID = "coin_magnet";
    public static final String INVISIBILITY_GOOD_ITEM_ID = "invisibility";
    public static final String TRIPLE_VALUE_GOOD_ITEM_ID = "triple_value";
    public static final String RESURRECTION_WINGS_GOOD_ITEM_ID = "resurrection_wings";
    public static final String PERMANENT_WINGS_GOOD_ITEM_ID = "perm_wings";
    public static final String BOOST_AHEAD_GOOD_ITEM_ID = "boost_ahead";
    public static final String MEGA_BOOST_GOOD_ITEM_ID = "mega_boost";
    public static final String GUY_DANGEROUS_GOOD_ITEM_ID = "guy_dangerous";
    public static final String SCARLETT_FOX_GOOD_ITEM_ID = "scarlett_fox";
    public static final String BARRY_BONES_GOOD_ITEM_ID = "barry_bones";
    public static final String KARMA_KIM_GOOD_ITEM_ID = "karma_kim";
    public static final String MONTANA_SMITH_GOOD_ITEM_ID = "montana_smith";
 
    public static final String _2_500_PACK_ITEM_ID = "muffins_10";
    public static final String _25_000_PACK_ITEM_ID = "muffins_50";
    public static final String _75_000_PACK_ITEM_ID = "muffins_400";
    public static final String _200_000_PACK_ITEM_ID = "muffins_1000";
 
    public static final String _2_500_PACK_PRODUCT_ID = "2500_coins";
    public static final String _25_000_PACK_PRODUCT_ID = "android.test.purchased";
    public static final String _75_000_PACK_PRODUCT_ID = "75000_coins";
    public static final String _200_000_PACK_PRODUCT_ID = "200000_coins";


    /** Virtual Categories **/

    
    public static final VirtualCategory POWERUPS_CATEGORY = new VirtualCategory(
             "POWERUPS", // name
             1); // id
    public static final VirtualCategory UTILITIES_CATEGORY = new VirtualCategory(
             "UTILITIES", // name
             2); // id
    public static final VirtualCategory CHARACTERS_CATEGORY = new VirtualCategory(
             "CHARACTERS", // name
             3); // id


    /** Virtual Currencies **/

    
    public static final VirtualCurrency COINS_CURRENCY = new VirtualCurrency(
             "Coins", // name
             "", // description
             COINS_CURRENCY_ITEM_ID); // item id


    /** Virtual Goods **/

    
    private static final HashMap<String, Integer> MEGA_COIN_PRICE = new HashMap<String, Integer>();
    static {
        MEGA_COIN_PRICE.put(COINS_CURRENCY_ITEM_ID, 2500);
    }
    public static final VirtualGood MEGA_COIN_GOOD = new VirtualGood(
             "Mega Coin", // name
             "Increase Mega Coin to 100 Coins", // description
             new StaticPriceModel(MEGA_COIN_PRICE), // price
             MEGA_COIN_GOOD_ITEM_ID, // item id
             POWERUPS_CATEGORY, // category
             false);
    
    private static final HashMap<String, Integer> COIN_MAGNET_PRICE = new HashMap<String, Integer>();
    static {
        COIN_MAGNET_PRICE.put(COINS_CURRENCY_ITEM_ID, 2500);
    }
    public static final VirtualGood COIN_MAGNET_GOOD = new VirtualGood(
             "Coin Magnet", // name
             "Coin Magnet doubles coin value", // description
             new StaticPriceModel(COIN_MAGNET_PRICE), // price
             COIN_MAGNET_GOOD_ITEM_ID, // item id
             POWERUPS_CATEGORY, // category
             false);
    
    private static final HashMap<String, Integer> INVISIBILITY_PRICE = new HashMap<String, Integer>();
    static {
        INVISIBILITY_PRICE.put(COINS_CURRENCY_ITEM_ID, 2500);
    }
    public static final VirtualGood INVISIBILITY_GOOD = new VirtualGood(
             "Invisibility", // name
             "Make Invisibiilty Last Longer", // description
             new StaticPriceModel(INVISIBILITY_PRICE), // price
             INVISIBILITY_GOOD_ITEM_ID, // item id
             POWERUPS_CATEGORY, // category
             false);
    
    private static final HashMap<String, Integer> TRIPLE_VALUE_PRICE = new HashMap<String, Integer>();
    static {
        TRIPLE_VALUE_PRICE.put(COINS_CURRENCY_ITEM_ID, 2500);
    }
    public static final VirtualGood TRIPLE_VALUE_GOOD = new VirtualGood(
             "Triple Value", // name
             "Triple Value coins after 3000m", // description
             new StaticPriceModel(TRIPLE_VALUE_PRICE), // price
             TRIPLE_VALUE_GOOD_ITEM_ID, // item id
             POWERUPS_CATEGORY, // category
             false);
    
    private static final HashMap<String, Integer> RESURRECTION_WINGS_PRICE = new HashMap<String, Integer>();
    static {
        RESURRECTION_WINGS_PRICE.put(COINS_CURRENCY_ITEM_ID, 500);
    }
    public static final VirtualGood RESURRECTION_WINGS_GOOD = new VirtualGood(
             "Resurrection Wings", // name
             "When active you resurrect immediately after death", // description
             new StaticPriceModel(RESURRECTION_WINGS_PRICE), // price
             RESURRECTION_WINGS_GOOD_ITEM_ID, // item id
             UTILITIES_CATEGORY, // category
             false);
    
    private static final HashMap<String, Integer> PERMANENT_WINGS_PRICE = new HashMap<String, Integer>();
    static {
        PERMANENT_WINGS_PRICE.put(COINS_CURRENCY_ITEM_ID, 10000);
    }
    public static final VirtualGood PERMANENT_WINGS_GOOD = new VirtualGood(
             "Permanent Wings", // name
             "Resurrection wings that are active permanently", // description
             new StaticPriceModel(PERMANENT_WINGS_PRICE), // price
             PERMANENT_WINGS_GOOD_ITEM_ID, // item id
             UTILITIES_CATEGORY, // category
             false);
    
    private static final HashMap<String, Integer> BOOST_AHEAD_PRICE = new HashMap<String, Integer>();
    static {
        BOOST_AHEAD_PRICE.put(COINS_CURRENCY_ITEM_ID, 2500);
    }
    public static final VirtualGood BOOST_AHEAD_GOOD = new VirtualGood(
             "Boost Ahead", // name
             "Boost ahead 1000m at the start of the game", // description
             new StaticPriceModel(BOOST_AHEAD_PRICE), // price
             BOOST_AHEAD_GOOD_ITEM_ID, // item id
             UTILITIES_CATEGORY, // category
             false);
    
    private static final HashMap<String, Integer> MEGA_BOOST_PRICE = new HashMap<String, Integer>();
    static {
        MEGA_BOOST_PRICE.put(COINS_CURRENCY_ITEM_ID, 10000);
    }
    public static final VirtualGood MEGA_BOOST_GOOD = new VirtualGood(
             "Mega Boost", // name
             "Mega Boost ahead 2500m at the start of the game", // description
             new StaticPriceModel(MEGA_BOOST_PRICE), // price
             MEGA_BOOST_GOOD_ITEM_ID, // item id
             UTILITIES_CATEGORY, // category
             false);
    
    private static final HashMap<String, Integer> GUY_DANGEROUS_PRICE = new HashMap<String, Integer>();
    static {
        GUY_DANGEROUS_PRICE.put(COINS_CURRENCY_ITEM_ID, 10000);
    }
    public static final VirtualGood GUY_DANGEROUS_GOOD = new VirtualGood(
             "Guy Dangerous", // name
             "Guy Dangerous, Just your average explorer", // description
             new StaticPriceModel(GUY_DANGEROUS_PRICE), // price
             GUY_DANGEROUS_GOOD_ITEM_ID, // item id
             CHARACTERS_CATEGORY, // category
             false);
    
    private static final HashMap<String, Integer> SCARLETT_FOX_PRICE = new HashMap<String, Integer>();
    static {
        SCARLETT_FOX_PRICE.put(COINS_CURRENCY_ITEM_ID, 10000);
    }
    public static final VirtualGood SCARLETT_FOX_GOOD = new VirtualGood(
             "Scarlett Fox", // name
             "Scarlett Fox, the cunning escape artist ", // description
             new StaticPriceModel(SCARLETT_FOX_PRICE), // price
             SCARLETT_FOX_GOOD_ITEM_ID, // item id
             CHARACTERS_CATEGORY, // category
             false);
    
    private static final HashMap<String, Integer> BARRY_BONES_PRICE = new HashMap<String, Integer>();
    static {
        BARRY_BONES_PRICE.put(COINS_CURRENCY_ITEM_ID, 10000);
    }
    public static final VirtualGood BARRY_BONES_GOOD = new VirtualGood(
             "Barry Bones", // name
             "Barry Bones, a city cop with an attitude", // description
             new StaticPriceModel(BARRY_BONES_PRICE), // price
             BARRY_BONES_GOOD_ITEM_ID, // item id
             CHARACTERS_CATEGORY, // category
             false);
    
    private static final HashMap<String, Integer> KARMA_KIM_PRICE = new HashMap<String, Integer>();
    static {
        KARMA_KIM_PRICE.put(COINS_CURRENCY_ITEM_ID, 25000);
    }
    public static final VirtualGood KARMA_KIM_GOOD = new VirtualGood(
             "Karma Kim", // name
             "Karma Kim, the fastest legs in the Far East", // description
             new StaticPriceModel(KARMA_KIM_PRICE), // price
             KARMA_KIM_GOOD_ITEM_ID, // item id
             CHARACTERS_CATEGORY, // category
             false);
    
    private static final HashMap<String, Integer> MONTANA_SMITH_PRICE = new HashMap<String, Integer>();
    static {
        MONTANA_SMITH_PRICE.put(COINS_CURRENCY_ITEM_ID, 25000);
    }
    public static final VirtualGood MONTANA_SMITH_GOOD = new VirtualGood(
             "Montana Smith", // name
             "Montana Smith, the secnod greatest explorer ever", // description
             new StaticPriceModel(MONTANA_SMITH_PRICE), // price
             MONTANA_SMITH_GOOD_ITEM_ID, // item id
             CHARACTERS_CATEGORY, // category
             false);
    

    /** Virtual Currency Packs **/
    
    public static final VirtualCurrencyPack _2_500_PACK = new VirtualCurrencyPack(
             "2,500", // name
             "", // description
             _2_500_PACK_ITEM_ID, // item id
             _2_500_PACK_PRODUCT_ID, // product id in Google Market
             0.99, // actual price in $$
             2500, // number of currencies in the pack
             COINS_CURRENCY); // the associated currency
    
    public static final VirtualCurrencyPack _25_000_PACK = new VirtualCurrencyPack(
             "25,000", // name
             "", // description
             _25_000_PACK_ITEM_ID, // item id
             _25_000_PACK_PRODUCT_ID, // product id in Google Market
             4.99, // actual price in $$
             25000, // number of currencies in the pack
             COINS_CURRENCY); // the associated currency
    
    public static final VirtualCurrencyPack _75_000_PACK = new VirtualCurrencyPack(
             "75,000", // name
             "", // description
             _75_000_PACK_ITEM_ID, // item id
             _75_000_PACK_PRODUCT_ID, // product id in Google Market
             9.99, // actual price in $$
             75000, // number of currencies in the pack
             COINS_CURRENCY); // the associated currency
    
    public static final VirtualCurrencyPack _200_000_PACK = new VirtualCurrencyPack(
             "200,000", // name
             "", // description
             _200_000_PACK_ITEM_ID, // item id
             _200_000_PACK_PRODUCT_ID, // product id in Google Market
             19.99, // actual price in $$
             200000, // number of currencies in the pack
             COINS_CURRENCY); // the associated currency
    

}