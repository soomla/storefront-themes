package com.soomla.example.airstrikeBravo;

import com.soomla.store.IStoreAssets;
import com.soomla.store.domain.data.*;
import java.util.HashMap;

public class AirstrikeBravoAssets implements IStoreAssets {

    @Override
    public VirtualCurrency[] getVirtualCurrencies(){
        return  new VirtualCurrency[] {
                COINS_CURRENCY
        };
    }

    @Override
    public VirtualGood[] getVirtualGoods(){
        return new VirtualGood[] {
               EXPERIMENTAL_FUEL_GOOD, BAND_AID_GOOD, FIRE_EXTINGUISHER_GOOD, EXTRA_LIFE_GOOD, LIGHTNING_BOLT_GOOD, MORE_TIME_GOOD, RED_CROSS_GOOD, BLUE_STAR_GOOD, PURPLE_HEART_GOOD, UPGRADE_1_GOOD, UPGRADE_2_GOOD, AIRPLANE_1_GOOD, AIRPLANE_2_GOOD, CLOTHING_1_GOOD, CLOTHING_2_GOOD
        };
    }

    @Override
    public VirtualCurrencyPack[] getVirtualCurrencyPacks(){
        return new VirtualCurrencyPack[] {
               COIN_BOOSTER_PACK_PACK, COIN_MEGA_PACK_PACK, COIN_ULTRA_PACK_PACK, COIN_JUMBO_PACK_PACK, COIN_ULTIMATE_PACK_PACK
        };
    }

    @Override
    public VirtualCategory[] getVirtualCategories() {
        return new VirtualCategory[]{
              UTILITIES_CATEGORY, GADGETS_CATEGORY, UPGRADES_CATEGORY, AIRPLANES_CATEGORY, CLOTHING_CATEGORY, CURRENCYPACKS_CATEGORY
        };
    }

    @Override
    public GoogleMarketItem[] getGoogleManagedItems() {
        return new GoogleMarketItem[0];
    }

    /** Static Final members **/
    
    public static final String COINS_CURRENCY_ITEM_ID = "currency_coin";
    
    public static final String EXPERIMENTAL_FUEL_GOOD_ITEM_ID = "experimental_fuel";
    public static final String BAND_AID_GOOD_ITEM_ID = "band_aid";
    public static final String FIRE_EXTINGUISHER_GOOD_ITEM_ID = "fire_extinguisher";
    public static final String EXTRA_LIFE_GOOD_ITEM_ID = "extra_life";
    public static final String LIGHTNING_BOLT_GOOD_ITEM_ID = "lightning_bolt";
    public static final String MORE_TIME_GOOD_ITEM_ID = "more_time";
    public static final String RED_CROSS_GOOD_ITEM_ID = "red_cross";
    public static final String BLUE_STAR_GOOD_ITEM_ID = "blue_star";
    public static final String PURPLE_HEART_GOOD_ITEM_ID = "purple_heart";
    public static final String UPGRADE_1_GOOD_ITEM_ID = "upgrade_1";
    public static final String UPGRADE_2_GOOD_ITEM_ID = "upgrade_2";
    public static final String AIRPLANE_1_GOOD_ITEM_ID = "airplane_1";
    public static final String AIRPLANE_2_GOOD_ITEM_ID = "airplane_2";
    public static final String CLOTHING_1_GOOD_ITEM_ID = "clothing_1";
    public static final String CLOTHING_2_GOOD_ITEM_ID = "clothing_2";
    
    public static final String COIN_BOOSTER_PACK_PACK_ITEM_ID = "muffins_10";
    public static final String COIN_MEGA_PACK_PACK_ITEM_ID = "muffins_50";
    public static final String COIN_ULTRA_PACK_PACK_ITEM_ID = "muffins_400";
    public static final String COIN_JUMBO_PACK_PACK_ITEM_ID = "muffins_1000";
    public static final String COIN_ULTIMATE_PACK_PACK_ITEM_ID = "muffins_1000";
    
    public static final String COIN_BOOSTER_PACK_PACK_PRODUCT_ID = "coin_booster_pack";
    public static final String COIN_MEGA_PACK_PACK_PRODUCT_ID = "android.test.purchased";
    public static final String COIN_ULTRA_PACK_PACK_PRODUCT_ID = "coin_ultra_pack";
    public static final String COIN_JUMBO_PACK_PACK_PRODUCT_ID = "coin_jumbo_pack";
    public static final String COIN_ULTIMATE_PACK_PACK_PRODUCT_ID = "coin_ultimate_pack";


    /** Virtual Categories **/
    
    public static final VirtualCategory UTILITIES_CATEGORY = new VirtualCategory(
                "utilities", 1);
    public static final VirtualCategory GADGETS_CATEGORY = new VirtualCategory(
                "gadgets", 2);
    public static final VirtualCategory UPGRADES_CATEGORY = new VirtualCategory(
                "upgrades", 3);
    public static final VirtualCategory AIRPLANES_CATEGORY = new VirtualCategory(
                "airplanes", 4);
    public static final VirtualCategory CLOTHING_CATEGORY = new VirtualCategory(
                "clothing", 5);
    public static final VirtualCategory CURRENCYPACKS_CATEGORY = new VirtualCategory(
                "currencyPacks", 6);


    /** Virtual Currencies **/
    
    public static final VirtualCurrency COINS_CURRENCY = new VirtualCurrency(
                "COINS",
                "",
                COINS_CURRENCY_ITEM_ID
    );


    /** Virtual Goods **/
    
    private static final HashMap<String, Integer> EXPERIMENTAL_FUEL_PRICE = new HashMap<String, Integer>();
    static {
        EXPERIMENTAL_FUEL_PRICE.put(COINS_CURRENCY_ITEM_ID, 250);
    }
    public static final VirtualGood EXPERIMENTAL_FUEL_GOOD = new VirtualGood(
            "EXPERIMENTAL FUEL", // name
            "FLY TWICE AS FAST BUT BE CAREFUL, THERE IS INCREASED CHANCE OF ENGINE FIRE", // description
            new StaticPriceModel(EXPERIMENTAL_FUEL_PRICE), // currency value
            "experimental_fuel", // item id
            UTILITIES_CATEGORY, // category
            false);
    
    private static final HashMap<String, Integer> BAND_AID_PRICE = new HashMap<String, Integer>();
    static {
        BAND_AID_PRICE.put(COINS_CURRENCY_ITEM_ID, 500);
    }
    public static final VirtualGood BAND_AID_GOOD = new VirtualGood(
            "BAND AID", // name
            "RECOVER FROM ONE INJURY", // description
            new StaticPriceModel(BAND_AID_PRICE), // currency value
            "band_aid", // item id
            UTILITIES_CATEGORY, // category
            false);
    
    private static final HashMap<String, Integer> FIRE_EXTINGUISHER_PRICE = new HashMap<String, Integer>();
    static {
        FIRE_EXTINGUISHER_PRICE.put(COINS_CURRENCY_ITEM_ID, 1000);
    }
    public static final VirtualGood FIRE_EXTINGUISHER_GOOD = new VirtualGood(
            "FIRE EXTINGUISHER", // name
            "RECOVER FROM ONE ENGINE FIRE", // description
            new StaticPriceModel(FIRE_EXTINGUISHER_PRICE), // currency value
            "fire_extinguisher", // item id
            UTILITIES_CATEGORY, // category
            false);
    
    private static final HashMap<String, Integer> EXTRA_LIFE_PRICE = new HashMap<String, Integer>();
    static {
        EXTRA_LIFE_PRICE.put(COINS_CURRENCY_ITEM_ID, 5000);
    }
    public static final VirtualGood EXTRA_LIFE_GOOD = new VirtualGood(
            "EXTRA LIFE", // name
            "ESCAPE DEATH ONCE. DOUBLE TAP UP TO 5 SECONDS AFTER GAME IS OVER", // description
            new StaticPriceModel(EXTRA_LIFE_PRICE), // currency value
            "extra_life", // item id
            UTILITIES_CATEGORY, // category
            false);
    
    private static final HashMap<String, Integer> LIGHTNING_BOLT_PRICE = new HashMap<String, Integer>();
    static {
        LIGHTNING_BOLT_PRICE.put(COINS_CURRENCY_ITEM_ID, 225);
    }
    public static final VirtualGood LIGHTNING_BOLT_GOOD = new VirtualGood(
            "LIGHTNING BOLT", // name
            "SNAP ALL ENEMIES ON SIGHT WITH A SINGLE SHOT. USE DOUBLE TAP TO ACTIVATE", // description
            new StaticPriceModel(LIGHTNING_BOLT_PRICE), // currency value
            "lightning_bolt", // item id
            GADGETS_CATEGORY, // category
            false);
    
    private static final HashMap<String, Integer> MORE_TIME_PRICE = new HashMap<String, Integer>();
    static {
        MORE_TIME_PRICE.put(COINS_CURRENCY_ITEM_ID, 175);
    }
    public static final VirtualGood MORE_TIME_GOOD = new VirtualGood(
            "MORE TIME", // name
            "GET AN EXTRA MINUTE TO COMPLETE YOUR TASK. TAP ON THE CLOCK TO USE IT", // description
            new StaticPriceModel(MORE_TIME_PRICE), // currency value
            "more_time", // item id
            GADGETS_CATEGORY, // category
            false);
    
    private static final HashMap<String, Integer> RED_CROSS_PRICE = new HashMap<String, Integer>();
    static {
        RED_CROSS_PRICE.put(COINS_CURRENCY_ITEM_ID, 375);
    }
    public static final VirtualGood RED_CROSS_GOOD = new VirtualGood(
            "RED CROSS", // name
            "DESCISE AS RED CROSS - INVISIBLE FOR 10 MILES", // description
            new StaticPriceModel(RED_CROSS_PRICE), // currency value
            "red_cross", // item id
            GADGETS_CATEGORY, // category
            false);
    
    private static final HashMap<String, Integer> BLUE_STAR_PRICE = new HashMap<String, Integer>();
    static {
        BLUE_STAR_PRICE.put(COINS_CURRENCY_ITEM_ID, 525);
    }
    public static final VirtualGood BLUE_STAR_GOOD = new VirtualGood(
            "BLUE STAR", // name
            "BLUE STAR WILL ALLOW YOU TO START AT A HEIGHT OF 10000 FT", // description
            new StaticPriceModel(BLUE_STAR_PRICE), // currency value
            "blue_star", // item id
            GADGETS_CATEGORY, // category
            false);
    
    private static final HashMap<String, Integer> PURPLE_HEART_PRICE = new HashMap<String, Integer>();
    static {
        PURPLE_HEART_PRICE.put(COINS_CURRENCY_ITEM_ID, 525);
    }
    public static final VirtualGood PURPLE_HEART_GOOD = new VirtualGood(
            "PURPLE HEART", // name
            "TAP TO ACTIVATE AND GET 10 HEALTH POINTS", // description
            new StaticPriceModel(PURPLE_HEART_PRICE), // currency value
            "purple_heart", // item id
            GADGETS_CATEGORY, // category
            false);
    
    private static final HashMap<String, Integer> UPGRADE_1_PRICE = new HashMap<String, Integer>();
    static {
        UPGRADE_1_PRICE.put(COINS_CURRENCY_ITEM_ID, 500);
    }
    public static final VirtualGood UPGRADE_1_GOOD = new VirtualGood(
            "UPGRADE 1", // name
            "THIS IS A REALLY GREAT UPGRADE THAT WILL MAKE THE GAME MUCH MORE EXCITING", // description
            new StaticPriceModel(UPGRADE_1_PRICE), // currency value
            "upgrade_1", // item id
            UPGRADES_CATEGORY, // category
            false);
    
    private static final HashMap<String, Integer> UPGRADE_2_PRICE = new HashMap<String, Integer>();
    static {
        UPGRADE_2_PRICE.put(COINS_CURRENCY_ITEM_ID, 1000);
    }
    public static final VirtualGood UPGRADE_2_GOOD = new VirtualGood(
            "UPGRADE 2", // name
            "THIS IS AN EVEN BETTER UPGRADE THAT WILL ALSO MAKE THE GAME FUN", // description
            new StaticPriceModel(UPGRADE_2_PRICE), // currency value
            "upgrade_2", // item id
            UPGRADES_CATEGORY, // category
            false);
    
    private static final HashMap<String, Integer> AIRPLANE_1_PRICE = new HashMap<String, Integer>();
    static {
        AIRPLANE_1_PRICE.put(COINS_CURRENCY_ITEM_ID, 2500);
    }
    public static final VirtualGood AIRPLANE_1_GOOD = new VirtualGood(
            "AIRPLANE 1", // name
            "THIS AIRPLANE FLIES REALLY HIGH", // description
            new StaticPriceModel(AIRPLANE_1_PRICE), // currency value
            "airplane_1", // item id
            AIRPLANES_CATEGORY, // category
            false);
    
    private static final HashMap<String, Integer> AIRPLANE_2_PRICE = new HashMap<String, Integer>();
    static {
        AIRPLANE_2_PRICE.put(COINS_CURRENCY_ITEM_ID, 5000);
    }
    public static final VirtualGood AIRPLANE_2_GOOD = new VirtualGood(
            "AIRPLANE 2", // name
            "THIS ONE FLIES FOR LONG DISTANCES", // description
            new StaticPriceModel(AIRPLANE_2_PRICE), // currency value
            "airplane_2", // item id
            AIRPLANES_CATEGORY, // category
            false);
    
    private static final HashMap<String, Integer> CLOTHING_1_PRICE = new HashMap<String, Integer>();
    static {
        CLOTHING_1_PRICE.put(COINS_CURRENCY_ITEM_ID, 1000);
    }
    public static final VirtualGood CLOTHING_1_GOOD = new VirtualGood(
            "CLOTHING 1", // name
            "THIS SHIRT WILL PROTECT YOU FROM FIRES", // description
            new StaticPriceModel(CLOTHING_1_PRICE), // currency value
            "clothing_1", // item id
            CLOTHING_CATEGORY, // category
            false);
    
    private static final HashMap<String, Integer> CLOTHING_2_PRICE = new HashMap<String, Integer>();
    static {
        CLOTHING_2_PRICE.put(COINS_CURRENCY_ITEM_ID, 1500);
    }
    public static final VirtualGood CLOTHING_2_GOOD = new VirtualGood(
            "CLOTHING 2", // name
            "THIS SHIRT WILL PROTECT YOU FROM BULLETS", // description
            new StaticPriceModel(CLOTHING_2_PRICE), // currency value
            "clothing_2", // item id
            CLOTHING_CATEGORY, // category
            false);
    


    /** Virtual Currency Packs **/
    
    public static final VirtualCurrencyPack COIN_BOOSTER_PACK_PACK = new VirtualCurrencyPack(
            "COIN BOOSTER PACK", // name
            "", // description
            "muffins_10", // item id
            COIN_BOOSTER_PACK_PACK_PRODUCT_ID, // product id in Google Market
            0.99, // actual price in $$
            20000, // number of currencies in the pack
            COINS_CURRENCY);
    
    public static final VirtualCurrencyPack COIN_MEGA_PACK_PACK = new VirtualCurrencyPack(
            "COIN MEGA PACK", // name
            "", // description
            "muffins_50", // item id
            COIN_MEGA_PACK_PACK_PRODUCT_ID, // product id in Google Market
            1.99, // actual price in $$
            50000, // number of currencies in the pack
            COINS_CURRENCY);
    
    public static final VirtualCurrencyPack COIN_ULTRA_PACK_PACK = new VirtualCurrencyPack(
            "COIN ULTRA PACK", // name
            "", // description
            "muffins_400", // item id
            COIN_ULTRA_PACK_PACK_PRODUCT_ID, // product id in Google Market
            2.99, // actual price in $$
            100000, // number of currencies in the pack
            COINS_CURRENCY);
    
    public static final VirtualCurrencyPack COIN_JUMBO_PACK_PACK = new VirtualCurrencyPack(
            "COIN JUMBO PACK", // name
            "", // description
            "muffins_1000", // item id
            COIN_JUMBO_PACK_PACK_PRODUCT_ID, // product id in Google Market
            4.99, // actual price in $$
            250000, // number of currencies in the pack
            COINS_CURRENCY);
    
    public static final VirtualCurrencyPack COIN_ULTIMATE_PACK_PACK = new VirtualCurrencyPack(
            "COIN ULTIMATE PACK", // name
            "", // description
            "muffins_1000", // item id
            COIN_ULTIMATE_PACK_PACK_PRODUCT_ID, // product id in Google Market
            9.99, // actual price in $$
            600000, // number of currencies in the pack
            COINS_CURRENCY);
    
}
