define(["jquery", "backbone", "components", "marionette", "handlebars", "templates", "jquery.fastbutton"], function($, Backbone, Components, Marionette, Handlebars) {

    // Define view types

    var getTemplate = Handlebars.getTemplate,
        SingleUseVirtualGoodView = Components.ItemView.extend(_.extend({
            template : getTemplate("item"),
            triggers : { "fastclick .buy" : "buy" }
        })),
        SectionedListView = Marionette.CompositeView.extend({
            className           : "items virtualGoods",
            template            : getTemplate("listContainer"),
            itemViewContainer   : ".container",
            getItemView: function(item) {

                if (!item) {
                    return Marionette.CompositeView.prototype.getItemView.apply(this, arguments);
                } else {

                    var itemView;

                    // some logic to calculate which view to return
                    // TODO: Add all virtual good types
                    switch (item.get("type")) {
                        case "singleUse":
                            itemView = SingleUseVirtualGoodView;
                            break;
                        case "equippable":
                            itemView = EquippableVirtualGoodView;
                            break;
                        case "lifetime":
                            itemView = LifetimeVirtualGoodView;
                            break;
                    }
                    return itemView;
                }
            }
        }),
        EquippableVirtualGoodView   = Components.EquippableItemView.extend({ template : getTemplate("equippableItem")}),
        LifetimeVirtualGoodView     = Components.LifetimeItemView.extend({ template : getTemplate("equippableItem")}),
        CurrencyPackView            = Components.ItemView.extend({ template : getTemplate("currencyPack") }),
        NonConsumableView           = Components.BuyOnceItemView.extend({template : getTemplate("nonConsumableItem") }),
        RestorePurchasesView        = Components.LinkView.extend({
            tagName: "div",
            template: getTemplate("restorePurchases")
        });


    var extendViews = function(model) {

        var theme = model.get("theme");


        // Add template helpers to view prototypes

        var templateHelpers = function() {

            var modelAssets = model.get("modelAssets");
            return _.extend({
                imgFilePath : modelAssets.items[this.model.id].url,
                currency : {
                    imgFilePath : modelAssets.items[this.model.getCurrencyId()].url
                },
                price : this.model.getPrice(),
                itemSeparator       : theme.itemSeparator

                // TODO: Move all properties under pages.goods.item and pages.currencyPacks.item and migrate DB

            }, theme.pages.goods.listItem);
        };


        SingleUseVirtualGoodView.prototype.templateHelpers  = templateHelpers;
        EquippableVirtualGoodView.prototype.templateHelpers = templateHelpers;
        LifetimeVirtualGoodView.prototype.templateHelpers   = templateHelpers;

        CurrencyPackView.prototype.templateHelpers = function() {
            var modelAssets = model.get("modelAssets");
            return {
                price           : this.model.getPrice(),
                nameStyle       : theme.pages.currencyPacks.listItem.nameStyle,
                priceStyle      : theme.pages.currencyPacks.listItem.priceStyle,
                itemSeparator   : theme.itemSeparator,
                imgFilePath     : modelAssets.items[this.model.id].url
            };
        };
        NonConsumableView.prototype.templateHelpers = function() {
            var modelAssets = model.get("modelAssets");
            return {
                nameStyle           : theme.pages.currencyPacks.listItem.nameStyle,
                priceStyle          : theme.pages.currencyPacks.listItem.priceStyle,
                itemSeparator       : theme.itemSeparator,
                ownedIndicatorImage : theme.common.ownedIndicatorImage,
                imgFilePath         : modelAssets.items[this.model.id].url
            };
        };

        RestorePurchasesView.prototype.templateHelpers = function() {
            return {
                itemSeparator   : theme.itemSeparator,
                imgFilePath     : theme.common.restorePurchasesImage
            };
        }
    };


    var StoreView = Components.BaseStoreView.extend({
        initialize : function() {
            _.bindAll(this, "showCurrencyPacks", "showGoodsStore");

            // Initialize dialog metadata
            this.dialogModal = this.theme.pages.goods.noFundsModal;
            this.messageDialogOptions = {
                background 	: this.dialogModal.background,
                textStyle 	: this.dialogModal.textStyle
            };
            this.loadingModal = _.extend({text : "Loading..."}, this.messageDialogOptions);


            this.categoryViews  = [];

            var currencies      = this.model.get("currencies"),
                categories      = this.model.get("categories"),
                nonConsumables  = this.model.get("nonConsumables");


            // View event listeners
            var wantsToBuyItem = _.bind(function (view) {
                this.playSound().wantsToBuyItem(view.model.id);
            }, this);
            var wantsToEquipGoods = _.bind(function (view) {
                this.playSound().wantsToEquipGoods(view.model);
            }, this);
            var wantsToRestorePurchases = _.bind(function () {
                this.playSound().wantsToRestorePurchases();
            }, this);

            // Create category views
            categories.each(function(category) {
                var categoryGoods   = category.get("goods"),
                    equipping       = category.get("equipping"),
                    view;

                view = new SectionedListView({
                    collection          : categoryGoods,
                    templateHelpers     : _.extend({category : category.get("name")}, this.theme.categories)
                }).on({
                    "itemview:buy" 		: wantsToBuyItem,
                    "itemview:equip" 	: wantsToEquipGoods
                });

                this.categoryViews.push(view);
            }, this);
            this.currencyPacksViews = [];
            currencies.each(function(currency) {
                var view = new Components.CollectionView({
                    className           : "items currencyPacks",
                    collection          : currency.get("packs"),
                    itemView            : CurrencyPackView
                }).on("itemview:select", wantsToBuyItem);

                this.currencyPacksViews.push(view)
            }, this);

            this.nonConsumablesView = new Components.CollectionView({
                className           : "items nonConsumables",
                collection          : nonConsumables,
                itemView            : NonConsumableView
            }).on("itemview:buy", wantsToBuyItem);


            // Add restore purchases view if necessary
            if (!nonConsumables.isEmpty()) {
                this.restorePurchasesView = new RestorePurchasesView().on("select", wantsToRestorePurchases);
            }

        },
        events : {
            // TODO: Change to timedEvents with `click` once the storeview extends Marionette.View
            "fastclick .leave-store" : "leaveStore",
            "fastclick .buy-more"    : "onClickBuyMore",
            "fastclick .back"        : "showGoodsStore"
        },
        ui : {
            goodsStore : "#goods-store",
            currencyStore : "#currency-store",
            goodsIscrollContainer : "#goods-store .items-container [data-iscroll='true']",
            currencyPacksContainer : "#currency-store .currency-packs"
        },
        updateBalance : function(model) {
            // TODO: Move to a header view
            this.$(".balance-container label").html(model.get("balance"));
        },
        onClickBuyMore : function() {
            this.playSound().showCurrencyPacks();
        },
        showCurrencyPacks : function() {
            // When this flag is raised, there is no connectivity,
            // thus don't show the currency store
            if (this.model.get("isCurrencyStoreDisabled")) {
                alert("Buying more " + this.model.get("currency").get("name") + " is unavailable. Check your internet connectivity and try again.");
            } else {
                this.ui.goodsStore.hide();
                this.ui.currencyStore.show();
                this.iscrolls.packs.refresh();
            }
        },
        showGoodsStore : function() {
            this.playSound();
            this.ui.currencyStore.hide();
            this.ui.goodsStore.show();
            this.iscrolls.goods.refresh();
        },
        iscrollRegions : {
            goods : {
                el : "#goods-store .items-container",
                options : {hScroll: false, vScrollbar: false}
            },
            packs : {
                el : "#currency-store .items-container",
                options : {hScroll: false, vScrollbar: false}
            }
        },
        onRender : function() {
            this.ui.currencyStore.hide();

            // Render subviews (items in goods store and currency store)
            _.each(this.categoryViews, function(view) {
                this.ui.goodsIscrollContainer.append(view.render().el);
            }, this);


            _.each(this.currencyPacksViews, function(view) {
                this.ui.currencyPacksContainer.append(view.render().el);
            }, this);

            this.$("#currency-store .non-consumables").html(this.nonConsumablesView.render().el);

            if (this.restorePurchasesView) {
                this.$("#restore-purchases").html(this.restorePurchasesView.render().el);
            }

        },
        zoomFunction : function() {
            return Math.min(innerWidth / 560, 1);
        }
    });

    return {
        createStoreView : function(options) {

            // Extend local Backbone views with theme specific template helpers
            extendViews(options.storeViewOptions.model);

            // Create store view instance
            return new StoreView(options.storeViewOptions).on("imagesLoaded", options.imagesLoadedCallback).render();
        }
    };
});

// grunt-rigger directive:
//= handlebars-templates
