define(["jquery", "backbone", "components", "marionette", "handlebars", "templates", "iscroll", "jquery.fastbutton"], function($, Backbone, Components, Marionette, Handlebars) {

    // Define view types

    var getTemplate = Handlebars.getTemplate,
        VirtualGoodView = Components.ItemView.extend(_.extend({
            template : getTemplate("item"),
            triggers : { "fastclick .buy" : "buy" }
        })),
        SectionedListView = Marionette.CompositeView.extend({
            className           : "items virtualGoods",
            template            : getTemplate("listContainer"),
            itemViewContainer   : ".container"
        }),
        EquippableVirtualGoodView   = Components.EquippableItemView.extend({ template : getTemplate("equippableItem")}),
        CurrencyPackView            = Components.ItemView.extend({ template : getTemplate("currencyPack") }),
        NonConsumableView           = Components.BuyOnceItemView.extend({template : getTemplate("nonConsumableItem") });


    var StoreView = Components.BaseStoreView.extend({
        initialize : function() {
            _.bindAll(this, "showCurrencyStore", "showGoodsStore");
            this.dialogModel    = this.theme.pages.goods.noFundsModal;
            this.categoryViews  = [];

            var $this           = this,
                currencies      = this.model.get("virtualCurrencies"),
                categories      = this.model.get("categories"),
                nonConsumables  = this.model.get("nonConsumables");


            // Add template helpers to view prototypes

            var templateHelpers = function() {

                var modelAssets = $this.model.get("modelAssets");
                return _.extend({
                    imgFilePath : modelAssets["virtualGoods"][this.model.id],
                    currency : {
                        imgFilePath : modelAssets["virtualCurrencies"][this.model.getCurrencyId()]
                    },
                    price : this.model.get("priceModel").values[this.model.getCurrencyId()],
                    itemSeparator       : $this.theme.itemSeparator

                    // TODO: Move all properties under pages.goods.item and pages.currencyPacks.item and migrate DB

                }, $this.theme.pages.goods.listItem);
            };


            VirtualGoodView.prototype.templateHelpers = templateHelpers;
            EquippableVirtualGoodView.prototype.templateHelpers = templateHelpers;
            CurrencyPackView.prototype.templateHelpers = function() {
                var modelAssets = $this.model.get("modelAssets");
                return {
                    nameStyle       : $this.theme.pages.currencyPacks.listItem.nameStyle,
                    priceStyle      : $this.theme.pages.currencyPacks.listItem.priceStyle,
                    itemSeparator   : $this.theme.itemSeparator,
                    imgFilePath     : modelAssets["currencyPacks"][this.model.id]
                };
            };
            NonConsumableView.prototype.templateHelpers = function() {
                var modelAssets = $this.model.get("modelAssets");
                return {
                    nameStyle           : $this.theme.pages.currencyPacks.listItem.nameStyle,
                    priceStyle          : $this.theme.pages.currencyPacks.listItem.priceStyle,
                    itemSeparator       : $this.theme.itemSeparator,
                    ownedIndicatorImage : $this.theme.common.ownedIndicatorImage,
                    imgFilePath         : modelAssets["nonConsumables"][this.model.id]
                };
            };


            // View event listeners
            var wantsToBuyVirtualGoods = _.bind(function (view) {
                this.playSound().wantsToBuyVirtualGoods(view.model);
            }, this);
            var wantsToEquipGoods = _.bind(function (view) {
                this.playSound().wantsToEquipGoods(view.model);
            }, this);
            var wantsToBuyMarketItem = _.bind(function (view) {
                this.playSound().wantsToBuyMarketItem(view.model);
            }, this);

            // Create category views
            categories.each(function(category) {
                var categoryGoods   = category.get("goods"),
                    equipping       = category.get("equipping"),
                    view;

                if (equipping === "single") {
                    view = new SectionedListView({
                        collection          : categoryGoods,
                        itemView            : EquippableVirtualGoodView,
                        templateHelpers     : _.extend({category : category.get("name")}, $this.theme.categories)
                    }).on({
                        "itemview:buy" 		: wantsToBuyVirtualGoods,
                        "itemview:equip" 	: wantsToEquipGoods
                    });
                } else {
                    view = new SectionedListView({
                        collection          : categoryGoods,
                        itemView            : VirtualGoodView,
                        templateHelpers     : _.extend({category : category.get("name")}, $this.theme.categories)
                    }).on("itemview:buy", wantsToBuyVirtualGoods);
                }
                $this.categoryViews.push(view);
            });
            this.currencyPacksViews = [];
            currencies.each(function(currency) {
                var view = new Components.CollectionView({
                    className           : "items currencyPacks",
                    collection          : currency.get("packs"),
                    itemView            : CurrencyPackView
                }).on("itemview:select", wantsToBuyMarketItem);

                $this.currencyPacksViews.push(view)
            });

            this.nonConsumablesView = new Components.CollectionView({
                className           : "items nonConsumables",
                collection          : nonConsumables,
                itemView            : NonConsumableView
            }).on("itemview:buy", wantsToBuyMarketItem);

        },
        events : {
            // TODO: Change to timedEvents with `click` once the storeview extends Marionette.View
            "fastclick .leave-store" : "leaveStore",
            "fastclick .buy-more"    : "showCurrencyStore",
            "fastclick .back"        : "showGoodsStore"
        },
        updateBalance : function(model) {
            this.$(".balance-container label").html(model.get("balance"));
        },
        showCurrencyStore : function() {
            this.playSound();

            // When this flag is raised, there is no connectivity,
            // thus don't show the currency store
            if (this.model.get("isCurrencyStoreDisabled")) {
                alert("Buying more " + this.model.get("currency").get("name") + " is unavailable. Check your internet connectivity and try again.");
            } else {
                this.$("#goods-store").hide();
                this.$("#currency-store").show();
                this.packsIScroll.refresh();
            }
        },
        showGoodsStore : function() {
            this.playSound();
            this.$("#currency-store").hide();
            this.$("#goods-store").show();
            this.goodsIScroll.refresh();
        },
        onRender : function() {
            var $this = this;
            this.$("#currency-store").hide();

            // Render subviews (items in goods store and currency store)
            _.each(this.categoryViews, function(view) {
                $this.$("#goods-store .items-container [data-iscroll='true']").append(view.render().el);
            });


            _.each(this.currencyPacksViews, function(view) {
                $this.$("#currency-store .currency-packs").append(view.render().el);
            });

            this.$("#currency-store .non-consumables").html(this.nonConsumablesView.render().el);

            // Create IScrolls
            this.goodsIScroll = new iScroll(this.$("#goods-store .items-container")[0],     {hScroll: false, vScrollbar: false});
            this.packsIScroll = new iScroll(this.$("#currency-store .items-container")[0],  {hScroll: false, vScrollbar: false});
            this.once("imagesLoaded", function() {
                $this.goodsIScroll.refresh();
                $this.packsIScroll.refresh();
            });
        },
        zoomFunction : function() {
            return Math.min(innerWidth / 560, 1);
        }
    });

    return {
        StoreView : StoreView
    };
});

// grunt-rigger directive:
//= handlebars-templates
