define("airstrikeBravoViews", ["jquery", "backbone", "components", "helperViews", "handlebars", "cssUtils", "templates"], function($, Backbone, Components, HelperViews, Handlebars, CssUtils) {

    //
    // grunt-rigger directive - DO NOT DELETE
    //= handlebars-templates
    //


    var transitionend = CssUtils.getTransitionendEvent();


    // Define view types

    var HeaderView                      = HelperViews.HeaderView,
        getTemplate                     = Handlebars.getTemplate,
        ExpandableEquippableItemView    = Components.ExpandableEquippableItemView,
        ExpandableSingleUseItemView     = Components.ExpandableSingleUseItemView,
        EquippableVirtualGoodView       = ExpandableEquippableItemView.extend({ template : getTemplate("equippableItem") }),
        SingleUseVirtualGoodView        = ExpandableSingleUseItemView.extend({ template : getTemplate("singleUseItem")}),
        UpgradableItemView              = Components.ExpandableUpgradableItemView.extend({ template : getTemplate("upgradableItem")}),
        LifetimeVirtualGoodView         = Components.ExpandableLifetimeItemView.extend({ template : getTemplate("equippableItem")}),
        CurrencyPackView                = Components.CurrencyPackView.extend({ template : getTemplate("currencyPack") }),
        CategoryView                    = Components.LinkView.extend({ template : getTemplate("categoryMenuItem") }),
        NonConsumableView               = Components.BuyOnceItemView.extend({ template : getTemplate("nonConsumableItem")}),
        IScrollCollectionView           = Components.IScrollCollectionView.extend({ template: getTemplate("collection") }),
        CurrencyPacksCollectionView     = Components.ExpandableIScrollCollectionView.extend({ template: getTemplate("collection") }),
        GoodsCollectionView             = Components.ExpandableIScrollCollectionView.extend({
            template: getTemplate("collection"),
            getItemView: function(item) {

                if (!item) {
                    return Components.ExpandableIScrollCollectionView.prototype.getItemView.apply(this, arguments);
                } else {

                    var itemView;

                    if (item.get("upgrades")) {
                        itemView = UpgradableItemView;
                    } else {

                        // some logic to calculate which view to return
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
                    }

                    return itemView;
                }
            }
        });


    var extendViews = function(model) {

        var theme           = model.get("theme"),
            commonHelpers   = { images : theme.images };


        // Add template helpers to view prototypes

        var createTemplateHelpers = function(helpers) {
            return _.extend(helpers, commonHelpers);
        };
        var templateHelpers = function () {

            var modelAssets = model.getModelAssets();
            return createTemplateHelpers({
                imgFilePath: modelAssets.items[this.model.id] || this._imagePlaceholder,
                currency: {
                    imgFilePath: modelAssets.items[this.model.getCurrencyId()] || this._imagePlaceholder
                },
                price: this.model.getPrice(),

                // This is a hack, because Backofgen ignores empty objects in the theme
                item: (theme.pages.goods && theme.pages.goods.item) ? theme.pages.goods.item : {}
            });
        };

        EquippableVirtualGoodView.prototype.templateHelpers = templateHelpers;
        SingleUseVirtualGoodView.prototype.templateHelpers  = templateHelpers;
        LifetimeVirtualGoodView.prototype.templateHelpers   = templateHelpers;
        UpgradableItemView.prototype.templateHelpers        = function() {
            var modelAssets     = model.getModelAssets(),
                nextUpgrade     = this.model.getNextUpgrade(),
                upgradeBarImage = this.model.getCurrentUpgradeBarAssetId();

            return createTemplateHelpers({

                // Assets
                imgFilePath 	: modelAssets.items[nextUpgrade.id] || this._imagePlaceholder,
                upgradeBarImage : modelAssets.items[upgradeBarImage] || this._progressBarPlaceholder,

                // Metadata
                name 			: nextUpgrade.get("name"),
                description 	: nextUpgrade.get("description"),
                price 			: this.model.getPrice(),
                currency 		: {
                    imgFilePath : modelAssets.items[this.model.getCurrencyId()] || this._imagePlaceholder
                },

                // This is a hack, because Backofgen ignores empty objects in the theme
                item : (theme.pages.goods && theme.pages.goods.item) ? theme.pages.goods.item : {}
            });
        };

        CurrencyPackView.prototype.templateHelpers = function() {
            var modelAssets = model.getModelAssets();
            return createTemplateHelpers({
                price: this.model.getPrice(),
                imgFilePath : modelAssets.items[this.model.id] || this._imagePlaceholder,
                currency: {
                    imgFilePath: modelAssets.items[this.model.getCurrencyId()] || this._imagePlaceholder
                },

                // This is a hack, because Backofgen ignores empty objects in the theme
                item: (theme.pages.currencyPacks && theme.pages.currencyPacks.item) ? theme.pages.currencyPacks.item : {}
            });
        };
        CategoryView.prototype.templateHelpers = function() {
            var modelAssets = model.getModelAssets();
            return {
                imgFilePath : modelAssets.categories[this.model.id] || this._imagePlaceholder
            };
        };
        NonConsumableView.prototype.templateHelpers = function() {
            var modelAssets = model.getModelAssets();
            return createTemplateHelpers({
                imgFilePath : modelAssets.items[this.model.id] || this._imagePlaceholder
            });
        };

    };


    var StoreView = Components.BaseStoreView.extend({
        initialize : function() {

            _.bindAll(this, "buyItem", "equipGoods");

            // Initialize dialog metadata
            this.dialogModal = this.theme.noFundsModal;
            this.messageDialogOptions = {
                background 	: this.dialogModal.background,
                textStyle 	: this.dialogModal.textStyle
            };
            this.loadingModal = _.extend({text : "Loading..."}, this.messageDialogOptions);


            var currencies 		= this.model.getCurrencies(),
                categories      = this.model.getCategories(),
                nonConsumables  = this.model.get("nonConsumables"),
                tapjoy          = this.theme.tapjoy;

            this.headerStates   = {};


            // Build category menu and add it to the page views
            this.categoryMenuView = new IScrollCollectionView({
                className   : "menu items clearfix",
                collection  : categories,
                itemView    : CategoryView
            }).on("itemview:select", function(view) {
                this.playSound().changeViewTo(this.children.findByCustom(view.model.id));
            }, this);
            this.children.add(this.categoryMenuView, "menu");
            this.headerStates[this.categoryMenuView.cid] = this.theme.pages.menu.title;


            // Create a view for the button linking from the category menu to the currency packs view
            // We're using a CategoryView, because visually the button should look the same, even though
            // it doesn't represent an actual category.  This view will be force-appended to the
            // categories view when rendering
            this.currencyPacksLinks = new Backbone.ChildViewContainer();

            currencies.each(this.addCurrencyLinkView, this);
            currencies.on({
                add : function(currency) {
                    this.addCurrencyLinkView(currency, {render : true});
                },
                remove : this.removeCurrencyLinkView
            }, this);

            // Create views for the earned currency links from the category menu.
            // We're using a CategoryView, because visually the button should look the same, even though
            // it doesn't represent an actual category.  This view will be force-appended to the
            // categories view when rendering
            this.nonConsumbaleLinks = [];

            nonConsumables.each(function(nonConsumable) {

                var view = new NonConsumableView({
                    className : "item non-consumable",
                    model : nonConsumable
                }).on("buy", this.buyItem);

                this.nonConsumbaleLinks.push(view);
            }, this);

            // Create a view for a Tapjoy link from the category menu.
            // We're using a CategoryView, because visually the button should look the same, even though
            // it doesn't represent an actual category.  This view will be force-appended to the
            // categories view when rendering
            if (tapjoy) {
                this.tapjoyView = new CategoryView({
                    className : "item earned-currency",
                    templateHelpers : { imgFilePath : this.model.getModelAssets().items.tapjoy || this._imagePlaceholder }
                }).on("select", function() {
                    this.playSound().requestEarnedCurrency("tapjoy");
                }, this);
            }


            // Mark this view as the active view,
            // as it is the first one visible when the store opens
            this.activeView = this.categoryMenuView;


            // Render all categories with goods
            categories.each(this.addCategoryView, this);
            categories.on({
                add : function(category) {
                    this.addCategoryView(category, {render : true});
                },
                remove : this.removeCategoryView,
                "change:name" : function(model) {
                    var changedAttributes   = model.changedAttributes(),
                        previousAttributes  = model.previousAttributes();

                    // Replace the indexed child view's key
                    if (changedAttributes && previousAttributes && changedAttributes.name && previousAttributes.name) {
                        var view = this.children.findByCustom(previousAttributes.name);
                        this.children.remove(view);
                        this.children.add(view, changedAttributes.name)
                    }
                }
            }, this);


            // Build currency packs category and add it to the page views
            currencies.each(this.addCurrencyView, this);
            currencies.on({
                add : function(currency) {
                    this.addCurrencyView(currency, {render : true});
                },
                remove : this.removeCurrencyView,
                "change:itemId" : function(model) {
                    var changedAttributes   = model.changedAttributes(),
                    previousAttributes  = model.previousAttributes();

                    // Replace the indexed child view's key
                    if (changedAttributes && previousAttributes && changedAttributes.itemId && previousAttributes.itemId) {
                        var view = this.children.findByCustom(previousAttributes.itemId);
                        this.children.remove(view);
                        this.children.add(view, changedAttributes.itemId)
                    }
                }
            }, this);



            // Build header view
            this.header = new HeaderView({states : this.headerStates, initialState : this.categoryMenuView.cid}).on({
                back: function () {
                    this.playSound();

                    // Switch back to the menu
                    this.changeViewTo(this.categoryMenuView);
                },
                quit: this.leaveStore
            }, this);
        },
        changeActiveViewByModel: function (model) {
            var view = this.children.findByCustom(model.id);
            this.changeViewTo(view);
        },
        changeViewTo: function (newview) {
            // Collapse open item in current category
            if (this.activeView.collapseExpandedChild)
                this.activeView.collapseExpandedChild({ noSound: true });

            if (this.activeView != newview) {
                var _activeMenu = this.activeView.$el.hasClass("menu");
                var _pages = this.activeView.$el.parents("div#pages");

                if (_activeMenu) {
                    _pages.addClass("slide");
                    // add class "on" to the relevant category only
                    newview.$el.addClass("on");
                } else {
                    if (newview.$el.hasClass("menu")) {
                        // new view is menu
                        _pages.removeClass("slide");
                    } else {
                        // switching between two views and NOT going thru menu...
                        // add class "on" to the relevant category only
                        newview.$el.addClass("on");
                    }
                    // remove class "on" from "old" category
                    this.activeView.$el.removeClass("on");
                }

                newview.$el.one(transitionend, function(){
                    $(_pages).animate({ scrollTop: 0 }, "slow");
                });
                /*
                 this.activeView.$el.hide();
                 this.activeView = newview;
                 this.activeView.$el.show();
                 */
                this.activeView = newview;
                if (this.activeView.refreshIScroll) this.activeView.refreshIScroll();
                this.header.changeStateTo(newview.cid);
            }
        },
        changeViewToItem: function (itemId) {
            if (!itemId) return;
            
            var currencyPacksItem = this.model.packsMap[itemId];
            if (currencyPacksItem) {
                var currency = currencyPacksItem.getCurrencyId();
                this.showCurrencyPacks(currency);
                this.activeView.scrollToItemByModel(currencyPacksItem, 500);
                return;
            }

            var goodsItem = this.model.goodsMap[itemId];
            if (!goodsItem) {
                console.log('View was not changed. Could not find item: "' + itemId + '".');
                return;
            }

            var category = this.model.categoryMap[itemId],
                view     = this.children.findByCustom(category.id);

            // Change to view of given category
            this.changeViewTo(view);
            this.activeView.scrollToItemByModel(goodsItem, 500);
        },
        showCurrencyPacks : function(currencyId) {
            // Change to view of given currency ID
            var currency    = this.model.getCurrency(currencyId),
                view        = this.children.findByCustom(currency.id);
            this.changeViewTo(view);
        },
        ui : {
            pages   : "#pages",
            header  : ".header"
        },
        onRender: function () {
            // Set header element to bind event delegation
            this.header.setElement(this.ui.header).render().bindUIElements();

            // Render child views (items in goods store and currency store)
            this.children.each(this._appendContainerView, this);

            var menu = this.children.findByCustom("menu").$el.children(":first-child");

            // Append the link to the currency packs as a "category view"
            this.currencyPacksLinks.each(this.appendCurrencyLinkView, this);

            // Append links to earned currencies as "category views"
            if (this.tapjoyView) menu.append(this.tapjoyView.render().el);

            // Append non consumable items as "category views"
            _.each(this.nonConsumbaleLinks, function(view) {
                menu.append(view.render().el);
            });

            if (this.activeView.refreshIScroll) this.activeView.refreshIScroll();
        },
        // View event listeners
        buyItem : function (view) {
            this.playSound().wantsToBuyItem(view.model.id);
        },
        equipGoods : function (view) {
            this.playSound().wantsToEquipGoods(view.model);
        },
        upgradeGood : function(view) {
            this.playSound().wantsToUpgradeVirtualGood(view.model);
        },
        zoomFunction : function() {
            return (innerWidth / innerHeight) > 1.5 ? (innerHeight / 640) : (innerWidth / 960);
        },

        _appendContainerView : function(view) {
            this.ui.pages.append(view.render().el);
        },

        appendCurrencyLinkView : function(link) {
            var menu = this.children.findByCustom("menu").$el.children(":first-child");
            menu.append(link.render().el);
        },

        addCategoryView : function(category, options) {

            var categoryName 	= category.get("name"),
                goods           = category.get("goods"),
                view;

            view = new GoodsCollectionView({
                className   : "items virtualGoods category " + categoryName,
                collection  : goods
            }).on({

                // This is a special playSound function that resolves the playSound
                // function defined on the store view object only when called.
                // This is used so that the function from the nativeAPI stubs is called
                "itemview:expand"   : _.bind(function() {
                    return this.playSound();
                }, this),
                "itemview:collapse" : this.conditionalPlaySound,
                "itemview:buy"      : this.buyItem,
                "itemview:equip"    : this.equipGoods,
                "itemview:upgrade"  : this.upgradeGood
            }, this);

            this.children.add(view, category.id);
            this.headerStates[view.cid] = categoryName;

            // If the `render` flag is provided, i.e. a category
            // was externally added, render it!
            if (options && options.render === true) this.appendCategoryView(view);
        },

        addCurrencyLinkView : function(currency, options) {
            var view = new CategoryView({
                className : "item currency-packs",
                templateHelpers : { imgFilePath : this.theme.currencyPacksCategoryImage }
            }).on("select", function() {
                this.playSound().changeViewTo(this.children.findByCustom(currency.id));
            }, this);

            this.currencyPacksLinks.add(view, currency.id);

            // If the `render` flag is provided, i.e. a category
            // was externally added, render it!
            if (options && options.render === true) {
                this.appendCurrencyLinkView(view);

                // Refresh iscroll to support adding more currencies from dashboard
                var menu = this.children.findByCustom("menu");
                menu.refreshIScroll();
            }
        },

        addCurrencyView : function(currency, options) {
            var view = new CurrencyPacksCollectionView({
                className   : "items currencyPacks category",
                collection  : currency.get("packs"),
                itemView    : CurrencyPackView
            }).on("itemview:buy", this.buyItem);
            this.children.add(view, currency.id);
            this.headerStates[view.cid] = currency.get("name");

            // If the `render` flag is provided, i.e. a category
            // was externally added, render it!
            if (options && options.render === true) this.appendCurrencyView(view);
        },
        removeCurrencyLinkView : function(currency) {
            var view = this.currencyPacksLinks.findByCustom(currency.id);
            view.close();
            this.currencyPacksLinks.remove(view);
        },
        _removeContainerView : function(container) {
            this.changeViewTo(this.categoryMenuView);
            var view = this.children.findByCustom(container.id);
            view.close();
            this.children.remove(view);
            delete this.headerStates[view.cid];
        }
    });

    _.extend(StoreView.prototype, {
        appendCategoryView : StoreView.prototype._appendContainerView,
        appendCurrencyView : StoreView.prototype._appendContainerView,
        removeCategoryView : StoreView.prototype._removeContainerView,
        removeCurrencyView : StoreView.prototype._removeContainerView
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
