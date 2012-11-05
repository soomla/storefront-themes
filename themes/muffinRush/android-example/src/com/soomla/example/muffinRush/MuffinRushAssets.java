package com.soomla.example.muffinRush;

import com.soomla.store.IStoreAssets;
import com.soomla.store.domain.data.*;

import java.util.HashMap;

public class MuffinRushAssets implements IStoreAssets {

    @Override
    public VirtualCurrency[] getVirtualCurrencies(){
        return  new VirtualCurrency[] {
                MUFFIN_CURRENCY
        };
    }

    @Override
    public VirtualGood[] getVirtualGoods(){
        return new VirtualGood[] {
                MUFFINCAKE_GOOD, PAVLOVA_GOOD,
                CHOCLATECAKE_GOOD, CREAMCUP_GOOD
        };
    }

    @Override
    public VirtualCurrencyPack[] getVirtualCurrencyPacks(){
        return new VirtualCurrencyPack[] {
                TENMUFF_PACK, FIFTYMUFF_PACK, FORTYMUFF_PACK, THOUSANDMUFF_PACK
        };
    }

    @Override
    public VirtualCategory[] getVirtualCategories() {
        return new VirtualCategory[]{
                GENERAL_CATEGORY
        };
    }

    @Override
    public GoogleMarketItem[] getGoogleManagedItems() {
        return new GoogleMarketItem[0];
    }


    /** Static Final members **/

    public static final String MUFFIN_CURRENCY_ITEM_ID      = "currency_muffin";
    public static final String TENMUFF_PACK_PRODUCT_ID      = "android.test.refunded";
    public static final String FIFTYMUFF_PACK_PRODUCT_ID    = "android.test.canceled";
    public static final String FORTYMUFF_PACK_PRODUCT_ID    = "android.test.purchased";
    public static final String THOUSANDMUFF_PACK_PRODUCT_ID = "android.test.item_unavailable";

    /** Virtual Categories **/
    // The muffin rush theme doesn't support categories, so we just put everything under a general category.
    public static final VirtualCategory GENERAL_CATEGORY = new VirtualCategory(
            "General", 0
    );

    /** Virtual Currencies **/
    public static final VirtualCurrency MUFFIN_CURRENCY = new VirtualCurrency(
            "Muffins",
            "",
            MUFFIN_CURRENCY_ITEM_ID
    );

    /** Virtual Goods **/
    private static final HashMap<String, Integer> MUFFINCAKE_PRICE =
            new HashMap<String, Integer>();
    static {
        MUFFINCAKE_PRICE.put(MUFFIN_CURRENCY_ITEM_ID, 225);
    }
    public static final VirtualGood MUFFINCAKE_GOOD = new VirtualGood(
            "Fruit Cake",                                   // name
            "Customers buy a double portion on each purchase of this cake", // description
            new StaticPriceModel(MUFFINCAKE_PRICE),         // currency value
            "fruit_cake"                                    // item id
            ,
            GENERAL_CATEGORY, false);

    private static final HashMap<String, Integer> PAVLOVA_PRICE =
            new HashMap<String, Integer>();
    static {
        PAVLOVA_PRICE.put(MUFFIN_CURRENCY_ITEM_ID, 175);
    }
    public static final VirtualGood PAVLOVA_GOOD = new VirtualGood(
            "Pavlova",                                      // name
            "Gives customers a sugar rush and they call their friends",      // description
            new StaticPriceModel(PAVLOVA_PRICE),            // currency value
            "pavlova"                                       // item id
            ,
            GENERAL_CATEGORY, false);

    private static final HashMap<String, Integer> CHOCLATECAKE_PRICE =
            new HashMap<String, Integer>();
    static {
        CHOCLATECAKE_PRICE.put(MUFFIN_CURRENCY_ITEM_ID, 250);
    }
    public static final VirtualGood CHOCLATECAKE_GOOD = new VirtualGood(
            "Chocolate Cake",                               // name
            "A classic cake to maximize customer satisfaction",// description
            new StaticPriceModel(CHOCLATECAKE_PRICE),       // currency value
            "chocolate_cake"                                // item id
            ,
            GENERAL_CATEGORY, false);

    private static final HashMap<String, Integer> CREAMCUP_PRICE =
            new HashMap<String, Integer>();
    static {
        CREAMCUP_PRICE.put(MUFFIN_CURRENCY_ITEM_ID, 50);
    }
    public static final VirtualGood CREAMCUP_GOOD = new VirtualGood(
            "Cream Cup",                                    // name
            "Increase bakery reputation with this original pastry",   // description
            new StaticPriceModel(CREAMCUP_PRICE),           // currency value
            "cream_cup"                                     // item id
            ,
            GENERAL_CATEGORY, false);

    /** Virtual Currency Packs **/

    public static final VirtualCurrencyPack TENMUFF_PACK = new VirtualCurrencyPack(
            "10 Muffins",                                   // name
            " (refund test)",                               // description
            "muffins_10",                                   // item id
            TENMUFF_PACK_PRODUCT_ID,                        // product id in Google Market
            0.99,                                           // actual price in $$
            10,                                             // number of currencies in the pack
            MUFFIN_CURRENCY);

    public static final VirtualCurrencyPack FIFTYMUFF_PACK = new VirtualCurrencyPack(
            "50 Muffins",                                   // name
            " (canceled test)",                             // description
            "muffins_50",                                   // item id
            FIFTYMUFF_PACK_PRODUCT_ID,                      // product id in Google Market
            1.99,                                           // actual price in $$
            50,                                             // number of currencies in the pack
            MUFFIN_CURRENCY);

    public static final VirtualCurrencyPack FORTYMUFF_PACK = new VirtualCurrencyPack(
            "400 Muffins",                                  // name
            "ONLY THIS WORKS IN THIS EXAMPLE (purchase test)",// description
            "muffins_400",                                  // item id
            FORTYMUFF_PACK_PRODUCT_ID,                      // product id in Google Market
            4.99,                                           // actual price in $$
            400,                                            // number of currencies in the pack
            MUFFIN_CURRENCY);

    public static final VirtualCurrencyPack THOUSANDMUFF_PACK = new VirtualCurrencyPack(
            "1000 Muffins",                                 // name
            " (item_unavailable test)",                     // description
            "muffins_1000",                                 // item id
            THOUSANDMUFF_PACK_PRODUCT_ID,                   // product id in Google Market
            8.99,                                           // actual price in $$
            1000,                                           // number of currencies in the pack
            MUFFIN_CURRENCY);

}
