define(["jquery", "backbone", "components", "marionette", "handlebars", "templates", "jquery.fastbutton"], function($, Backbone, Components, Marionette, Handlebars) {

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
                imgFilePath : modelAssets["virtualGoods"][this.model.id],
                currency : {
                    imgFilePath : modelAssets["virtualCurrencies"][this.model.getCurrencyId()]
                },
                price : this.model.get("priceModel").values[this.model.getCurrencyId()],
                itemSeparator       : theme.itemSeparator

                // TODO: Move all properties under pages.goods.item and pages.currencyPacks.item and migrate DB

            }, theme.pages.goods.listItem);
        };


        VirtualGoodView.prototype.templateHelpers = templateHelpers;
        EquippableVirtualGoodView.prototype.templateHelpers = templateHelpers;
        CurrencyPackView.prototype.templateHelpers = function() {
            var modelAssets = model.get("modelAssets");
            return {
                nameStyle       : theme.pages.currencyPacks.listItem.nameStyle,
                priceStyle      : theme.pages.currencyPacks.listItem.priceStyle,
                itemSeparator   : theme.itemSeparator,
                imgFilePath     : modelAssets["currencyPacks"][this.model.id]
            };
        };
        NonConsumableView.prototype.templateHelpers = function() {
            var modelAssets = model.get("modelAssets");
            return {
                nameStyle           : theme.pages.currencyPacks.listItem.nameStyle,
                priceStyle          : theme.pages.currencyPacks.listItem.priceStyle,
                itemSeparator       : theme.itemSeparator,
                ownedIndicatorImage : theme.common.ownedIndicatorImage,
                imgFilePath         : modelAssets["nonConsumables"][this.model.id]
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
            this.dialogModal    = this.theme.pages.goods.noFundsModal;
            this.loadingModal = {
                "text": "Loading...",
                "background": this.dialogModal.background,
                "textStyle": this.dialogModal.textStyle
            };

            this.categoryViews  = [];

            var currencies      = this.model.get("virtualCurrencies"),
                categories      = this.model.get("categories"),
                nonConsumables  = this.model.get("nonConsumables");


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
            var wantsToRestorePurchases = _.bind(function () {
                this.playSound().wantsToRestorePurchases();
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
                        templateHelpers     : _.extend({category : category.get("name")}, this.theme.categories)
                    }).on({
                        "itemview:buy" 		: wantsToBuyVirtualGoods,
                        "itemview:equip" 	: wantsToEquipGoods
                    });
                } else {
                    view = new SectionedListView({
                        collection          : categoryGoods,
                        itemView            : VirtualGoodView,
                        templateHelpers     : _.extend({category : category.get("name")}, this.theme.categories)
                    }).on("itemview:buy", wantsToBuyVirtualGoods);
                }
                this.categoryViews.push(view);
            }, this);
            this.currencyPacksViews = [];
            currencies.each(function(currency) {
                var view = new Components.CollectionView({
                    className           : "items currencyPacks",
                    collection          : currency.get("packs"),
                    itemView            : CurrencyPackView
                }).on("itemview:select", wantsToBuyMarketItem);

                this.currencyPacksViews.push(view)
            }, this);

            this.nonConsumablesView = new Components.CollectionView({
                className           : "items nonConsumables",
                collection          : nonConsumables,
                itemView            : NonConsumableView
            }).on("itemview:buy", wantsToBuyMarketItem);


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
        onClickBuyMore: function () {
            this.showCurrencyPacks();
        },
        changeViewToItem: function (itemId) {
            if (!itemId)
                return;

            var currencyPacksItem = this.model.currencyPacksMap[itemId];
            if (currencyPacksItem) {
                this.showCurrencyPacks();
                _.each(this.currencyPacksViews, function (currencyPackView) {
                    var itemView = currencyPackView.children.findByModel(currencyPacksItem);
                    if (itemView) {
                        this.iscrolls.packs.scrollToElement(itemView.el, 500);
                        return;
                    }
                }, this);
                return;
            }

            var nonConsumableItem = this.model.get("nonConsumables").get(itemId);
            if (nonConsumableItem) {
                this.showCurrencyPacks();
                var itemView = this.nonConsumablesView.children.findByModel(nonConsumableItem);
                if (itemView) {
                    this.iscrolls.packs.scrollToElement(itemView.el, 500);
                }
                return;
            }

            var goodsItem = this.model.goodsMap[itemId];
            if (goodsItem) {
                this.showGoodsStore();
                _.each(this.categoryViews, function (categoryView) {
                    var itemView = categoryView.children.findByModel(goodsItem);
                    if (itemView) {
                        this.iscrolls.goods.scrollToElement(itemView.el, 500);
                        return;
                    }
                }, this);
                return;
            }

            console.log('View was not changed. Could not find item: "' + itemId + '".');
        },
        showCurrencyPacks : function() {
            this.playSound();

            // When this flag is raised, there is no connectivity,
            // thus don't show the currency store
            if (this.model.get("isCurrencyStoreDisabled")) {
                alert("Buying more " + this.model.get("currency").get("name") + " is unavailable. Check your internet connectivity and try again.");
            } else {
                var that = this;
                that.ui.currencyStore.removeClass("hide");
                that.ui.currencyStore.removeClass("showBtn");
                that.ui.currencyStore.addClass("on");
                
                that.ui.currencyStore.bind("transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd", function(){ 
                    that.ui.currencyStore.unbind("transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd");
                    that.ui.goodsStore.removeClass("showBtn");
                    that.ui.currencyStore.addClass("showBtn");
                    that.iscrolls.packs.refresh();
                });
                /*
                this.ui.goodsStore.hide();
                this.ui.currencyStore.show();
                this.iscrolls.packs.refresh();
                */
            }
        },
        showGoodsStore : function() {
            var that = this;
            that.playSound();

            that.ui.currencyStore.addClass("hide");
            that.ui.currencyStore.bind("transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd", function(){ 
                that.ui.currencyStore.unbind("transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd");
                that.ui.currencyStore.removeClass("on");
                that.ui.goodsStore.addClass("showBtn");
                that.iscrolls.goods.refresh();
            });

            //this.ui.currencyStore.hide();
            //this.ui.goodsStore.show();
            //that.iscrolls.goods.refresh();
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
            //this.ui.currencyStore.hide();
            //this.ui.goodsStore.addClass("showBtn");

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
            var that = this;
            setTimeout(function(){
                    that.ui.goodsStore.addClass("showBtn");
                }, 200);

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
