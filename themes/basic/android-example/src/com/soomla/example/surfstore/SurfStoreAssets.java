package com.soomla.example.surfstore;

import com.soomla.store.IStoreAssets;
import com.soomla.store.domain.data.*;

import java.util.ArrayList;
import java.util.HashMap;

public class SurfStoreAssets implements IStoreAssets {

    @Override
    public VirtualCurrency[] getVirtualCurrencies(){
        return  new VirtualCurrency[] {
                CLAM_CURRENCY
        };
    }

    @Override
    public VirtualGood[] getVirtualGoods(){
        return new VirtualGood[] {
                    RIPCURLSHORTBOARD_GOOD, BILLABONGVINTAGELONGBOARD_GOOD,
                    KEELFISH_GOOD, PICASSOPEELER_GOOD, REEFSHREDDER_GOOD,
                    SIXTIESGUN_GOOD, TRADITIONALFISH_GOOD
        };
    }

    @Override
    public VirtualCurrencyPack[] getVirtualCurrencyPacks(){
        return new VirtualCurrencyPack[] {
                    SUPERSAVERPACK_PACK, MALIBUMEDIUMPACK_PACK, PIPELINEPUMPKINPACK_PACK, SILVERPACK_PACK
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

    public static final String CLAM_CURRENCT_ITEM_ID = "currency_clam";

    /** Virtual Categories **/
    // The surf store theme doesn't support categories, so we just put everything under a general category.
    public static final VirtualCategory GENERAL_CATEGORY = new VirtualCategory(
            "General", 0
    );

    /** Virtual Currencies **/
    public static final VirtualCurrency CLAM_CURRENCY = new VirtualCurrency(
            "clams",
            "",
            CLAM_CURRENCT_ITEM_ID
    );

    /** Virtual Goods **/
    private static final HashMap<String, Integer> RIPCURLSHORTBOARD_PRICE =
            new HashMap<String, Integer>();
    static {
        RIPCURLSHORTBOARD_PRICE.put(CLAM_CURRENCT_ITEM_ID, 100);
    }
    public static final VirtualGood RIPCURLSHORTBOARD_GOOD = new VirtualGood(
            "Rip Curl Shortboard",                          // name
            "Shred small waves with this super-fast board", // description
            new StaticPriceModel(RIPCURLSHORTBOARD_PRICE),// currency value
            "blue_surfboard"                                // item id
            ,
            GENERAL_CATEGORY, false);

    private static final HashMap<String, Integer> BILLABONGVINTAGELONGBOARD_PRICE =
            new HashMap<String, Integer>();
    private static final ArrayList<HashMap<String, Integer>> BILLABONGVINTAGELONGBOARD_PRICE_LIST =
            new ArrayList<HashMap<String, Integer>>();
    static {
        BILLABONGVINTAGELONGBOARD_PRICE.put(CLAM_CURRENCT_ITEM_ID, 150);
        BILLABONGVINTAGELONGBOARD_PRICE_LIST.add(RIPCURLSHORTBOARD_PRICE);
        BILLABONGVINTAGELONGBOARD_PRICE_LIST.add(BILLABONGVINTAGELONGBOARD_PRICE);
    }
    public static final VirtualGood BILLABONGVINTAGELONGBOARD_GOOD = new VirtualGood(
            "Billanbog Vintage Longboard",                  // name
            "Slowly hang five through low power surf",      // description
            new BalanceDrivenPriceModel(BILLABONGVINTAGELONGBOARD_PRICE_LIST),// currency value
            "girl_surfboard_th"                             // item id
            ,
            GENERAL_CATEGORY, false);

    private static final HashMap<String, Integer> KEELFISH_PRICE =
            new HashMap<String, Integer>();
    static {
        KEELFISH_PRICE.put(CLAM_CURRENCT_ITEM_ID, 200);
    }
    public static final VirtualGood KEELFISH_GOOD = new VirtualGood(
            "Keel Fish",                                    // name
            "Carve slow waves with this ever-riding board", // description
            new StaticPriceModel(KEELFISH_PRICE),           // currency value
            "keelfish"                                      // item id
            ,
            GENERAL_CATEGORY, false);

    private static final HashMap<String, Integer> PICASSOPEELER_PRICE =
            new HashMap<String, Integer>();
    static {
        PICASSOPEELER_PRICE.put(CLAM_CURRENCT_ITEM_ID, 300);
    }
    public static final VirtualGood PICASSOPEELER_GOOD = new VirtualGood(
            "Picasso Peeler",                               // name
            "The master of surreal off-the-lip maneuvers",  // description
            new StaticPriceModel(PICASSOPEELER_PRICE),      // currency value
            "picasso_peeler"                                // item id
            ,
            GENERAL_CATEGORY, false);

    private static final HashMap<String, Integer> REEFSHREDDER_PRICE =
            new HashMap<String, Integer>();
    static {
        REEFSHREDDER_PRICE.put(CLAM_CURRENCT_ITEM_ID, 300);
    }
    public static final VirtualGood REEFSHREDDER_GOOD = new VirtualGood(
            "Reef Shredder",                                // name
            "A mean paddling machine for the deep reefs",   // description
            new StaticPriceModel(REEFSHREDDER_PRICE),       // currency value
            "reef_shredder"                                 // item id
            ,
            GENERAL_CATEGORY, false);

    private static final HashMap<String, Integer> SIXTIESGUN_PRICE =
            new HashMap<String, Integer>();
    static {
        SIXTIESGUN_PRICE.put(CLAM_CURRENCT_ITEM_ID, 400);
    }
    public static final VirtualGood SIXTIESGUN_GOOD = new VirtualGood(
            "Sixties Gun",                                  // name
            "Ride Venice-style with this time machine",     // description
            new StaticPriceModel(SIXTIESGUN_PRICE),         // currency value
            "sixties_gun"                                   // item id
            ,
            GENERAL_CATEGORY, false);

    private static final HashMap<String, Integer> TRADITIONALFISH_PRICE =
            new HashMap<String, Integer>();
    static {
        TRADITIONALFISH_PRICE.put(CLAM_CURRENCT_ITEM_ID, 450);
    }
    public static final VirtualGood TRADITIONALFISH_GOOD = new VirtualGood(
            "Traditional Fish",                             // name
            "The all around conditions board of choice",    // description
            new StaticPriceModel(TRADITIONALFISH_PRICE),    // currency value
            "traditional_fish"                              // item id
            ,
            GENERAL_CATEGORY, false);


    /** Virtual Currency Packs **/

    public static final VirtualCurrencyPack SUPERSAVERPACK_PACK = new VirtualCurrencyPack(
            "Super Saver Pack",                             // name
            "Testing for a refund ...",                     // description
            "super_saver_pack",                             // item id
            "android.test.refunded",                        // product id in Google Market
            0.99,                                           // actual price in $$
            200,                                            // number of currencies in the pack
            CLAM_CURRENCY);

    public static final VirtualCurrencyPack MALIBUMEDIUMPACK_PACK = new VirtualCurrencyPack(
            "Malibu Medium Pack",                           // name
            "Testing for an item purchase ...",             // description
            "malibu_medium_pack",                           // item id
            "android.test.purchased",                       // product id in Google Market
            1.99,                                           // actual price in $$
            500,                                            // number of currencies in the pack
            CLAM_CURRENCY);

    public static VirtualCurrencyPack PIPELINEPUMPKINPACK_PACK = new VirtualCurrencyPack(
            "Pipeline Pumpin' Pack",                        // name
            "Testing for purchase cacellation ...",         // description
            "pipeline_pumpin_pack",                         // item id
            "android.test.canceled",                        // product id in Google Market
            5.99,                                           // actual price in $$
            1500,                                           // number of currencies in the pack
            CLAM_CURRENCY);

    public static VirtualCurrencyPack SILVERPACK_PACK = new VirtualCurrencyPack(
            "Silver Pack",                                  // name
            "Testing for item unavailable ...",             // description
            "pipeline_pumpin_pack",                         // item id
            "android.test.item_unavailable",                // product id in Google Market
            15.99,                                          // actual price in $$
            5500,                                           // number of currencies in the pack
            CLAM_CURRENCY);
}
