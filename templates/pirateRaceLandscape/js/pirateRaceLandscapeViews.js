define(["jquery", "backbone", "components", "marionette", "handlebars", "templates", "jquery.fastbutton"], function($, Backbone, Components, Marionette, Handlebars) {

    // Define view types

    var getTemplate = Handlebars.getTemplate,
        VirtualGoodView = Components.ItemView.extend(_.extend({
            template : getTemplate("item"),
            triggers : { "fastclick .buy" : "buy" }
        })),
        CategoryHeaderView = Components.LinkView.extend({
            tagName: "span",
            template: getTemplate("categoryHeader"),
            triggers: { "fastclick .category": "chooseCategory" }
        }),
        SectionedListView = Marionette.CompositeView.extend({
            className           : "items", // clearfix
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

        CategoryHeaderView.prototype.templateHelpers = templateHelpers;
        VirtualGoodView.prototype.templateHelpers = templateHelpers;
        EquippableVirtualGoodView.prototype.templateHelpers = templateHelpers;
        CurrencyPackView.prototype.templateHelpers = function() {
            var modelAssets = model.get("modelAssets");
            return {
                nameStyle       : theme.pages.currencyPacks.listItem.nameStyle,
                priceStyle      : theme.pages.currencyPacks.listItem.priceStyle,
                buy             : theme.pages.currencyPacks.listItem.buy,
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
            _.bindAll(this, "showGoodsStore");
            this.dialogModel = this.theme.pages.goods.noFundsModal;
            this.categoryHeaderViews = [];
            this.categoryViews  = [];

            var currencies      = this.model.get("virtualCurrencies"),
                categories      = this.model.get("categories"),
                nonConsumables = this.model.get("nonConsumables");

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
            var chooseCategory = _.bind(function (view) {
                var elementId = 'soomCat' + view.model.id;
                this.iscrolls.goods.scrollToElement('#' + elementId, 500);
            }, this);

            // Create category views
            var i = 0;
            this.numOfItems = 0;

            categories.each(function (category) {

                var headerView = new CategoryHeaderView({
                    model: category,
                    className: "categoryHeader",
                    templateHelpers: _.extend({ category: category.get("name"), id: category.get("id"), selected: (i++ == 0) ? "selected" : "" }, this.theme.categories)
                }).on("chooseCategory", chooseCategory);

                this.categoryHeaderViews.push(headerView);


                var categoryGoods   = category.get("goods"),
                    equipping       = category.get("equipping"),
                    view;
                this.numOfItems += (!!categoryGoods) ? categoryGoods.length : 0;

                if (equipping === "single") {
                    view = new SectionedListView({
                        collection          : categoryGoods,
                        itemView            : EquippableVirtualGoodView,
                        templateHelpers     : _.extend({category : category.get("name"), id: category.get("id")}, this.theme.categories)
                    }).on({
                        "itemview:buy" 		: wantsToBuyVirtualGoods,
                        "itemview:equip" 	: wantsToEquipGoods
                    });
                } else {
                    view = new SectionedListView({
                        collection          : categoryGoods,
                        itemView            : VirtualGoodView,
                        templateHelpers     : _.extend({category : category.get("name"), id: category.get("id")}, this.theme.categories)
                    }).on("itemview:buy", wantsToBuyVirtualGoods);
                }
                this.categoryViews.push(view);
            }, this);

            this.currencyPacksViews = [];
            currencies.each(function (currency) {
                var headerView = new CategoryHeaderView({
                    model: currency,
                    className: "currencyHeader",
                    templateHelpers: _.extend({ category: currency.get("name"), id: currency.get("itemId"), selected: "" }, this.theme.categories)
                }).on("chooseCategory", chooseCategory);

                this.categoryHeaderViews.push(headerView);

                var packs = currency.get("packs");
                this.numOfItems += (!!packs) ? packs.length : 0;

                var view = new SectionedListView({
                    className           : "items currencyPacks",
                    collection          : packs,
                    itemView            : CurrencyPackView,
                    templateHelpers: _.extend({ category: currency.get("name"), id: currency.get("itemId"), selected: "" }, this.theme.categories)
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

            this.numOfItems += nonConsumables.length;
        },
        events : {
            // TODO: Change to timedEvents with `click` once the storeview extends Marionette.View
            "fastclick .leave-store" : "leaveStore",
            "fastclick .buy-more"    : "onClickBuyMore",
            "fastclick .back"        : "showGoodsStore"
        },
        ui : {
            goodsStore: "#content-container",
            goodsHeader: "#content-container .header",
            goodsCategoriesHeader: "#content-container .header .categories",
            goodsIscrollContainer: "#content-container .items-container [data-iscroll='true']",
            currencyPacksContainer : ".currency-packs"
        },
        updateBalance : function(model) {
            // TODO: Move to a header view
            this.$(".balance-container label[data-currency='" + model.id + "']").html(model.get("balance"));
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
                this.iscrolls.goods.scrollToElement('.currencyPacks', 500);
                this.iscrolls.packs.refresh();
            }
        },
        showGoodsStore : function() {
            this.playSound();
            this.ui.goodsStore.show();
            this.iscrolls.goods.refresh();
        },
        iscrollRegions : {
            goods : {
                el : "#content-container .items-container",
                options: {
                    snap: 'li', hScroll: true, vScroll: false, hScrollbar: false, vScrollbar: false, onScrollEnd: function () {
                        //TODO: Change "206" to @itemWidth.
                        var itemIndex = Math.floor(Math.max(0, (Math.abs(this.x) + 3)) / 206);
                        var liElement = $('ul li', this.scroller)[itemIndex];
                        var categoryId = $('> div', liElement).data('categoryid');
                        $('div .categories .selected').toggleClass('selected', false);
                        $('#soomCatHeader' + categoryId).toggleClass('selected', true);
                } }
            },
        },
        onRender : function() {
            // Render subviews (categories, items in goods store and currency store)
            _.each(this.categoryHeaderViews, function (view) {
                this.ui.goodsCategoriesHeader.append(view.render().el);
            }, this);

            //TODO: Change "208" to @itemWidth.
            this.ui.goodsIscrollContainer[0].style.width = this.numOfItems * 208 + 'px';

            _.each(this.categoryViews, function(view) {
                this.ui.goodsIscrollContainer.append(view.render().el);
            }, this);

            _.each(this.currencyPacksViews, function(view) {
                this.ui.goodsIscrollContainer.append(view.render().el);
            }, this);

            this.$(".non-consumables").html(this.nonConsumablesView.render().el);

            if (this.restorePurchasesView) {
                this.$("#restore-purchases").html(this.restorePurchasesView.render().el);
            }

        },
        zoomFunction : function() {
            return (innerWidth / innerHeight) > 1.5 ? (innerHeight / 838) : (innerWidth / 1400);
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
