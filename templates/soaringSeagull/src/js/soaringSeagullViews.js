define("soaringSeagullViews", ["jquery", "backbone", "components", "handlebars", "cssUtils", "templates", "jquery.fastbutton", "jqueryUtils"], function($, Backbone, Components, Handlebars, CssUtils) {

	//
	// grunt-rigger directive - DO NOT DELETE
	//= handlebars-templates
    //


    var transitionend = CssUtils.getTransitionendEvent();


    // Define view types

    var getTemplate = Handlebars.getTemplate,
//        SingleUseVirtualGoodView = Components.SingleUseItemView.extend({ template : getTemplate("item") }),
        SectionedListView = Components.BaseCompositeView.extend({
            className           : "items virtualGoods",
            template            : getTemplate("listContainer"),
            itemViewContainer   : ".container",
            initialize : function() {
                this.listenTo(this.model, "change:name", this.render);
            },
            getItemView: function(item) {

                if (!item) {
                    return Components.BaseCompositeView.prototype.getItemView.apply(this, arguments);
                } else {

                    var itemView;

                    if (item.is("upgradable")) {
                        itemView = UpgradableItemView;
                    } else {

                        // some logic to calculate which view to return
                        switch (item.getType()) {
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
                    }
                    return itemView;
                }
            }
        }),
        CategoriesView = Components.CollectionView.extend({
            tagName : "div",
            itemView : SectionedListView,
            onItemviewItemviewExpand : function(sectionView, itemView) {

                // Make sure only one item view is expanded across all sections
                if ((this.expandedView) && (this.expandedView !== itemView)) this.expandedView.collapse();
                this.expandedView = itemView;
            }
        }),
        ExpandableEquippableItemView    = Components.ExpandableEquippableItemView,
        ExpandableSingleUseItemView     = Components.ExpandableSingleUseItemView,
        EquippableVirtualGoodView       = ExpandableEquippableItemView.extend({ template : getTemplate("equippableItem") }),
        SingleUseVirtualGoodView        = ExpandableSingleUseItemView.extend({ template : getTemplate("item"), animateBalanceClass : "changed"}),
        LifetimeVirtualGoodView         = Components.ExpandableLifetimeItemView.extend({ template : getTemplate("equippableItem")}),
        UpgradableItemView              = Components.ExpandableUpgradableItemView.extend({ template : getTemplate("upgradableItem")}),
        CurrencyPackView                = Components.CurrencyPackView.extend({ template : getTemplate("currencyPack")}),
        OfferItemView                   = Components.OfferItemView.extend({ template : getTemplate("offer") }),
        OffersCollectionView            = Components.CollectionView.extend({ itemView : OfferItemView });


    var extendViews = function(model) {

        var theme       = model.assets.theme,
            assets      = model.assets;

        // Add template helpers to view prototypes
        var templateHelpers = function() {
            return _.extend({
                imgFilePath : assets.getItemAsset(this.model.id),
                currency : {
                    imgFilePath : assets.getItemAsset(this.model.getCurrencyId())
                },
                price : this.model.getPrice(),
                isMarketPurchaseType : this.model.isMarketPurchaseType()

            }, theme.pages.goods.listItem);
        };

        SingleUseVirtualGoodView.prototype.templateHelpers  = templateHelpers;
        EquippableVirtualGoodView.prototype.templateHelpers = templateHelpers;
        LifetimeVirtualGoodView.prototype.templateHelpers   = function() {
            return _.extend({
                lifetime : theme.pages.goods.lifetime
            }, templateHelpers.call(this));
        };
        UpgradableItemView.prototype.templateHelpers        = function() {
            var nextUpgrade     = this.model.getNextUpgrade(),
                upgradeBarImage = this.model.getCurrentUpgradeBarAssetId();

            return _.extend({

                // Assets
                imgFilePath 	: assets.getUpgradeAsset(nextUpgrade.id),
                upgradeBarImage : assets.getUpgradeBarAsset(upgradeBarImage),

                // Metadata
                name 			: nextUpgrade.getName(),
                description 	: nextUpgrade.getDescription(),
                price 			: this.model.getPrice(),
                currency 		: {
                    imgFilePath : assets.getItemAsset(this.model.getCurrencyId())
                },
                goodUpgrades    : theme.pages.goods.goodUpgrades
            }, theme.pages.goods.listItem);
        };

        CurrencyPackView.prototype.templateHelpers = function() {
            return {
                price       : this.model.getPrice(),
                buyImage : theme.pages.currencyPacks.listItem.buyImage,
                currencyImage : assets.getItemAsset(this.model.getCurrencyId()),
                imgFilePath : assets.getItemAsset(this.model.id)
            };
        };
        OfferItemView.prototype.templateHelpers = function() {
            return {
                imgFilePath : assets.getHookAsset(this.model.id)
            };
        };
    };


    var StoreView = Components.BaseStoreView.extend({
        initialize : function() {
            _.bindAll(this, "showCurrencyPacks", "showGoodsStore", "buyItem", "equipGoods", "refreshGoodsIScroll", "refreshPacksIScroll");

            // Initialize dialog metadata
            this.dialogModal = this.theme.pages.goods.noFundsModal;
            this.messageDialogOptions = {
                background 	    : this.dialogModal.background,
                textStyle 	    : this.dialogModal.textStyle
            };
            this.loadingModal = {
                text            : this.theme.loadingModal.text,
                textStyle       : this.theme.loadingModal.textStyle,
                backgroundImage : this.theme.loadingModal.backgroundImage
            };


            this.currencyPacksViews = new Backbone.ChildViewContainer();
            var currencies      = this.model.getCurrencies(),
                categories      = this.model.getCategories(),
                offers          = this.model.getOfferHooks();


            // Create category views
            this.createCategoriesView(categories);


            // Create currency views
            currencies.each(this.addCurrencyView, this);
            currencies.on({
                add : function(currency) {
                    this.addCurrencyView(currency, {render : true});
                },
                remove : this.removeCurrencyView
            }, this);


            if (!offers.isEmpty()) {

                // Add offer items
                this.addOffersView(offers);
            }

            // Listen to offer changes
            this.listenTo(offers, {
                add : function() {
                    if (offers.size() === 1) this.addOffersView(offers, {render : true}).refreshPacksIScroll();
                },
                remove : function() {
                    if (offers.isEmpty()) this.removeOffersView().refreshPacksIScroll();
                }
            });
        },
        events : {
            "fastclick      .leave-store"   : "leaveStore",
            "fastclick      .buy-more"      : "onClickBuyMore",
            "fastclick      .back"          : "showGoodsStore"
        },
        ui : {
            goodsStore              : "#goods-store",
            currencyStore           : "#currency-store",
            backButton              : "#goods-store .btn1",
            goodsIscrollContainer   : "#goods-store .items-container [data-iscroll='true']",
            currencyPacksContainer  : "#currency-store .currency-packs",
            offersContainer         : "#offers-container"
        },
        emulateActiveElements : ".btn1,.btn2", // Valid jQuery selector
        _getBalanceHolder : function(currency) {
            return this.$(".balance-container label[data-currency='" + currency.id + "']");
        },
        onClickBuyMore: function () {
            this.playSound().showCurrencyPacks();
        },
        changeViewToItem: function (itemId) {
            if (!itemId)
                return;

            var currency = this.model.getCurrency(itemId);
            if (currency) {
                this.showCurrencyPacks();
                return;
            }

            var view;

            var hook = this.model.getHookById(itemId);
            if (hook) {

                this.showCurrencyPacks();

                // Change to view of given currency ID
                view = this.offersView.children.findByModel(hook);
                if (view) {
                    this.iscrolls.packs.scrollToElement(view.el, 500);
                    return;
                }
                return;
            }

            var currencyPacksItem = this.model.packsMap[itemId];
            if (currencyPacksItem) {
                this.showCurrencyPacks();
                this.currencyPacksViews.each(function (currencyPackView) {
                    view = currencyPackView.children.findByModel(currencyPacksItem);
                    if (view) {
                        this.iscrolls.packs.scrollToElement(view.el, 500);
                        return;
                    }
                }, this);
                return;
            }

            var category = this.model.getCategory(itemId);
            if (category) {
                this.showGoodsStore();
                return;
            }

            var goodsItem = this.model.goodsMap[itemId];
            if (goodsItem) {
                this.showGoodsStore();
                this.categoryViews.each(function (categoryView) {
                    view = categoryView.children.findByModel(goodsItem);
                    if (view) {
                        this.iscrolls.goods.scrollToElement(view.el, 500);
                        return;
                    }
                }, this);
                return;
            }

            console.log('View was not changed. Could not find item: "' + itemId + '".');
        },
        changeActiveViewByModel: function (model) {
            this.changeViewToItem(model.id);
        },
        showCurrencyPacks : function() {
            this.ui.currencyStore.removeClass("hide showBtn");

            this.ui.currencyStore.transitionOnce({klass : "on", remove : false}).done(_.bind(function(){
                this.ui.goodsStore.removeClass("on showBtn");
                this.ui.currencyStore.addClass("showBtn");
                this.refreshPacksIScroll();
            }, this));
        },
        showGoodsStore : function() {
            this.playSound();

            this.ui.goodsStore.addClass("on showBtn");
            this.ui.currencyStore.transitionOnce({klass : "hide", remove : false}).done(_.bind(function(){
                this.ui.currencyStore.removeClass("on");
                this.refreshGoodsIScroll();
            }, this));
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
            this.appendCategoriesView();
            this.currencyPacksViews.each(this.appendCurrencyView, this);

            // Append offers
            if (this.offersView) this.appendOffersView(this.offersView);

            var _this = this;
            setTimeout(function(){
                _this.ui.goodsStore.addClass("showBtn");
            }, 200);

            this.ui.backButton.one(transitionend, this.refreshGoodsIScroll);

            this.bindEventsToIScroll();
        },
        appendCategoriesView : function() {
            this.ui.goodsIscrollContainer.append(this.categoriesView.render().el);
        },
        appendCurrencyView : function(view) {
            this.ui.currencyPacksContainer.append(view.render().el);

            // The iscrolls exist only after initial rendering is complete
            if (this.iscrolls) this.refreshPacksIScroll();
        },
        appendOffersView : function(view) {
            this.ui.offersContainer.append(view.render().el);
            if (this.iscrolls) this.refreshPacksIScroll();
        },
        buyItem : function (categoryView, itemView) {
            this.playSound().wantsToBuyItem(itemView.model.id);
        },
        equipGoods : function (categoryView, itemView) {
            this.playSound().wantsToEquipGoods(itemView.model);
        },
        upgradeGood : function(categoryView, itemView) {
            this.playSound().wantsToUpgradeVirtualGood(itemView.model);
        },
        zoomFunction : function() {
            return (innerHeight / innerWidth) > 1.5 ? (innerWidth / 1280) : (innerHeight / 1920);
        },


        //
        // Functions for supporting external addition and removal of
        // categories and currencies.  Use by dashboard.
        //

        createCategoriesView : function(categories) {

            var templateHelpers = this.theme.categories;

            this.categoriesView = new CategoriesView({
                collection 		: categories,
                itemViewOptions : function(item) {
                    return {
                        model           : item,
                        collection      : item.getGoods(),
                        templateHelpers : templateHelpers
                    }
                }
            });

            // Listen to logical events
            this.listenTo(this.categoriesView, {
                "itemview:itemview:buy"     : this.buyItem,
                "itemview:itemview:equip" 	: this.equipGoods,
                "itemview:itemview:expand"  : this.refreshGoodsIScroll,
                "itemview:itemview:collapse": function() {

                    // Need to surround with `if` since the upgradable goods
                    // trigger a collapse event before the iscrolls were created
                    if (this.iscrolls) this.refreshGoodsIScroll();
                },
                "itemview:itemview:upgrade"  : this.upgradeGood
            });
        },
        bindEventsToIScroll : function() {

            //
            // Listen to view change events
            // Event legend:
            //
            // "after:item:added"           - Category added
            // "item:removed"               - Category removed
            // "itemview:after:item:added"  - Good added
            // "itemview:after:item:added"  - Good removed
            //
            this.listenTo(this.categoriesView, "after:item:added item:removed itemview:after:item:added itemview:item:removed", this.refreshGoodsIScroll);
        },
        addCurrencyView : function(currency, options) {
            var packs = currency.getPacks();
            var view = new Components.CollectionView({
                className           : "items currencyPacks",
                collection          : packs,
                itemView            : CurrencyPackView
            }).on("itemview:buy", this.buyItem);

            this.currencyPacksViews.add(view, currency.id);

            // If the `render` flag is provided, i.e. a category
            // was externally added, render it!
            if (options && options.render === true) this.appendCurrencyView(view);

            this.listenTo(packs, "add remove", this.refreshPacksIScroll);
        },
        addOffersView : function(offers, options) {
            this.offersView = new OffersCollectionView({
                className   : "items offers",
                collection  : offers
            }).on("itemview:select", function(view) {
                this.wantsToOpenOffer(view.model);
            }, this);


            // If the `render` flag is provided, i.e. an offer
            // was externally added, render it!
            if (options && options.render === true) this.appendOffersView(this.offersView);
            return this;
        },
        removeCurrencyView : function(currency) {
            var view = this.currencyPacksViews.findByCustom(currency.id);
            view.close();
            this.currencyPacksViews.remove(view);
            this.refreshPacksIScroll();
        },
        removeOffersView : function() {
            this.offersView.close();
            this.refreshPacksIScroll();
            return this;
        },
        refreshGoodsIScroll : function() {
            this.iscrolls.goods.refresh();
        },
        refreshPacksIScroll : function() {
            this.iscrolls.packs.refresh();
        }
    });
    StoreView.mixinActiveTouchEmulation();

    return {
        createStoreView : function(options) {

            // Extend local Backbone views with theme specific template helpers
            extendViews(options.storeViewOptions.model);

            // Create store view instance
            return new StoreView(options.storeViewOptions).on("imagesLoaded", options.imagesLoadedCallback).render();
        }
    };
});
