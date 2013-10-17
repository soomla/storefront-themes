define("leapOfFangsViews", ["jquery", "backbone", "components", "handlebars", "marionette", "cssUtils", "templates", "jquery.fastbutton"], function($, Backbone, Components, Handlebars, Marionette, CssUtils) {

    //
    // grunt-rigger directive - DO NOT DELETE
    //= handlebars-templates
    //


    var transitionend   = CssUtils.getTransitionendEvent(),
        offerWallsId    = Components.BaseStoreView.Const.offerWallsId,
        offerWallsTitle = Components.BaseStoreView.Const.offerWallsTitle;


    // Define view types

    var getTemplate = Handlebars.getTemplate,
        SingleUseVirtualGoodView = Components.SingleUseItemView.extend({ template : getTemplate("item"), animateBalanceClass : "balance-changed" }),
        EquippableItemView = Components.EquippableItemView.extend({

            // Local triggers not included, they are inherited from EquippableItemView
            template : getTemplate("equippableItem")
        }),
        LifetimeItemView = Components.LifetimeItemView.extend({

            // Local triggers not included, they are inherited from EquippableItemView
            template : getTemplate("equippableItem")
        }),
        CurrencyPackView = Components.CurrencyPackView.extend({ template : getTemplate("currencyPack") }),
        OfferWallView = Components.LinkView.extend({ template : getTemplate("offerWall"), className : "item offer-wall"}),
        CategoryMenuItemView = Components.LinkView.extend({
            template : getTemplate("categoryMenuItem")
        }),
        CurrencyMenuItemView = CategoryMenuItemView.extend(),
        MenuLinkView = CategoryMenuItemView.extend(),
        CarouselView = Components.CarouselView.extend({
            className           : "category",
            itemViewContainer   : ".goods",
            template            : getTemplate("category"),
            showNext            : function() {
                this.activeIndex += 1;
                if (this.activeIndex === this.children.length) this.activeIndex = 0;
                this.getActiveChild().$el.removeClass("appearLeftTransition").removeClass("appearLeftImmediately");
                this.getActiveChild().$el.addClass("appearRightImmediately");
                this.direction = "Left";
                this.switchActive().trigger("next");
            },
            showPrevious        : function() {
                this.activeIndex -= 1;
                this.activeChild.$el.addClass("appearRightTransition");
                if (this.activeIndex === -1) this.activeIndex = this.children.length - 1;
                this.direction = "Right";
                this.switchActive().trigger("previous");
            },
            switchActive        : function() {
                var that = this;
                that.activeChild.$el.removeClass("isOn");
                var oldActiveChild = that.activeChild;
                if(that.direction=="Left"){
                    that.activeChild.$el.addClass("appearLeftTransition");
                }else{
                    oldActiveChild.$el.one(transitionend, function(){
                        oldActiveChild.$el.removeClass("appearRightTransition").addClass("appearLeftImmediately");
                        // just a minor pause and then handle classes (cannot use "unbind" since relevant animation is 0 seconds)
                        setTimeout(function(){
                            oldActiveChild.$el.addClass("appearLeftTransition").removeClass("appearLeftImmediately");
                        }, 0)
                    }) 
                }
                
                that.activeChild = this.getActiveChild();
                that.activeChild.$el.addClass("isOn");
                
                setTimeout(function(){
                        that.activeChild.$el.removeClass( that.direction=="Left"?"appearRightImmediately":"appearLeftTransition" );
                }, 0);

                return this;
            },
            onRender            : function() {
                // Initialize variables necessary for next / previous functionality
                this.activeIndex = 0;
                this.activeChild = this.getActiveChild();

                // When adding an empty carousel (new category \ currency)
                // The active child will be undefined
                if (this.activeChild) {

                    this.children.each(function(view, idx) {
                        view.$el.addClass("appearLeftTransition");
                    }, this);
                    this.activeChild.$el.removeClass("appearLeftTransition");
                    this.activeChild.$el.addClass("isOn");
                    return this;
                }
            }
        }),

        CurrencyPacksCollectionView = CarouselView.extend(),
        GoodsCollectionView         = CarouselView.extend({
            getItemView: function(item) {

                if (!item) {
                    return CarouselView.prototype.getItemView.apply(this, arguments);
                } else {

                    var itemView;

                    // some logic to calculate which view to return
                    switch (item.get("type")) {
                        case "singleUse":
                            itemView = SingleUseVirtualGoodView;
                            break;
                        case "equippable":
                            itemView = EquippableItemView;
                            break;
                        case "lifetime":
                            itemView = LifetimeItemView;
                            break;
                    }
                    return itemView;
                }
            }
        }),
        OfferWallsCollectionView = CarouselView.extend({itemView : OfferWallView});


    var HeaderView = Marionette.ItemView.extend({
        initialize : function() {
            this.model.on("change:title", this.changeTitle, this);
        },
        ui : {
            title : "#title"
        },
        render : function() {
            this.bindUIElements();
            this.changeTitle();
        },
        changeTitle : function() {
            this.ui.title.html(this.model.get("title"));
        }
    });


    var extendViews = function(model) {

        var theme           = model.get("theme"),
            templateHelpers = { images : theme.images },
            assets          = model.assets;


        // Add template helpers to view prototypes

        var virtualGoodTemplateHelpers = function () {
            return _.extend({
                imgFilePath: assets.getItemAsset(this.model.id),
                currency: {
                    imgFilePath: assets.getItemAsset(this.model.getCurrencyId())
                },
                price: this.model.getPrice(),
                item: theme.item,
                isMarketPurchaseType : this.model.isMarketPurchaseType()
            }, templateHelpers);
        };
        SingleUseVirtualGoodView.prototype.templateHelpers  = virtualGoodTemplateHelpers;
        EquippableItemView.prototype.templateHelpers        = virtualGoodTemplateHelpers;
        LifetimeItemView.prototype.templateHelpers          = virtualGoodTemplateHelpers;

        CurrencyPackView.prototype.templateHelpers = function() {
            return _.extend({
                imgFilePath : assets.getItemAsset(this.model.id),
                currency : {
                    imgFilePath : assets.getItemAsset(this.model.getCurrencyId())
                },
                price: this.model.getPrice(),
                item : theme.item
            }, templateHelpers);
        };
        CategoryMenuItemView.prototype.templateHelpers = function() {
            return {
                imgFilePath : assets.getCategoryAsset(this.model.id)
            };
        };
        OfferWallView.prototype.templateHelpers = function() {
            return {
                imgFilePath : assets.getItemAsset(this.model.id)
            };
        };
        CurrencyMenuItemView.prototype.templateHelpers = function() {
            return {
                imgFilePath: (this.model.id == 'currency_coins') ? theme.currencyPacksCategoryImage : theme.currencyPacksCategoryImage2 || this._imagePlaceholder
            };
        };
        MenuLinkView.prototype.templateHelpers = function() {
            return {
                imgFilePath : assets.getOfferWallsLinkAsset() || this._imagePlaceholder
            };
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


            var categories = this.model.getCategories(),
                currencies = this.model.getCurrencies(),
                offerWalls = this.model.getOfferWalls();

            this.entityTemplateHelpers  = { images : this.theme.images };


            var onMenuItemSelect = function (view) {
                this.playSound().changeActiveViewByModel(view.model);
            };


            this.categoryMenu = new Components.CollectionView({
                collection          : categories,
                itemView            : CategoryMenuItemView,
                onRender            : function() {
                    // Activate tabs
                    this.$("li:first").addClass("active");
                }
            }).on("itemview:select", onMenuItemSelect, this);


            this.currencyMenu = new Components.CollectionView({
                collection : currencies,
                itemView : CurrencyMenuItemView
            }).on("itemview:select", onMenuItemSelect, this);



            // Build views for each category
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


            // Build views for each currency
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


            if (!offerWalls.isEmpty()) {

                // Add a menu link and category view
                this.addOfferWallsLinkView().addOfferWallsView(offerWalls);

                // Listen to offer wall changes
                this.listenTo(offerWalls, {
                    add : function() {
                        if (offerWalls.size() === 1) {
                            this.addOfferWallsLinkView({render : true}).addOfferWallsView(offerWalls, {render : true});
                        }
                    },
                    remove : function() {
                        if (offerWalls.isEmpty()) this.removeOfferWallsView().removeOfferWallsLink();
                    }
                });
            }


            // Set the active view to be the first category's view
            this.activeView = this.children.findByIndex(0);


            // Create header
            var title = categories.at(0).get("name");
            this.header = new Backbone.Model({title : title});
            this.headerView = new HeaderView({ model : this.header });

        },
        changeTitle : function(text) {
            this.header.set("title", text);
        },
        changeActiveViewByModel: function (model) {
            this.changeActiveView(model.id, model.get('name'));
        },
        changeActiveView : function(id, title) {
            this.activeView.$el.removeClass("active");
            this.activeView = this.children.findByCustom(id);
            var _index =  $("ul").index(this.activeView.$el);
            $("#categories > div").removeAttr("class").addClass("cat-" + _index);
            this.activeView.$el.addClass("active");
            this.changeTitle(title);
            return this;
        },
        changeViewToItem: function (itemId) {
            if (!itemId)
                return;

            var currencyPacksItem = this.model.packsMap[itemId];
            if (currencyPacksItem) {
                var currency = currencyPacksItem.getCurrencyId();
                this.showCurrencyPacks(currency);
                this.activeView.changeActiveByModel(currencyPacksItem);
                return;
            }

            var goodsItem = this.model.goodsMap[itemId];
            if (goodsItem) {
                var category = this.model.categoryMap[itemId];
                this.changeActiveViewByModel(category);
                this.activeView.changeActiveByModel(goodsItem);
                return;
            }

            console.log('View was not changed. Could not find item: "' + itemId + '".');
        },
        showCurrencyPacks: function (currencyId) {
            var currency = this.model.getCurrency(currencyId);
            this.changeActiveViewByModel(currency);
        },
        ui : {
            categoriesContainer : "#categories > div"
        },
        regions: {
            categoryMenu : "#category-menu",
            currencyMenu : "#currency-menu",
            offerWallsLink: "#offer-wall-menu",
            headerView   : "#header"
        },
        iscrollRegions : {
            categoryMenu : {
                el : "#footer",
                options : {vScroll: false, vScrollbar: false, hScrollbar: false}
            }
        },
        events : {
            "fastclick #quit" : "leaveStore"
        },
        emulateActiveElements : "#quit", // valid jQuery selector
        onRender : function() {

            // Render regions
            _.each(this.regions, function(selector, region) {
                this[region].setElement(selector).render();
            }, this);


            this.children.each(this._appendContainerView, this);

            // Assumes that the active view is the first category view
            this.activeView.$el.addClass("active");
        },
        zoomFunction : function() {
            return (innerHeight / innerWidth) > 1.5 ? (innerWidth / 720) : (innerHeight / 1280);
        },
        buyItem : function(view) {
            this.playSound().wantsToBuyItem(view.model.id);
        },
        equipGoods : function (view) {
            this.playSound().wantsToEquipGoods(view.model);
        },
        addCategoryView : function(category, options) {

            var view = new GoodsCollectionView({
                collection          : category.get("goods"),
                templateHelpers     : this.entityTemplateHelpers
            }).on({
                // This is a special playSound function that resolves the playSound
                // function defined on the store view object only when called.
                // This is used so that the function from the nativeAPI stubs is called
                "next previous"     : _.bind(function() {
                    return this.playSound();
                }, this),
                "itemview:buy"      : this.buyItem,
                "itemview:equip" 	: this.equipGoods
            });

            this.children.add(view, category.id);

            // If the `render` flag is provided, i.e. a category
            // was externally added, render it!
            if (options && options.render === true) this.appendCategoryView(view);
        },
        addCurrencyView : function(currency, options) {

            var view = new CurrencyPacksCollectionView({
                collection          : currency.get("packs"),
                itemView            : CurrencyPackView,
                templateHelpers     : this.entityTemplateHelpers
            }).on({
                // This is a special playSound function that resolves the playSound
                // function defined on the store view object only when called.
                // This is used so that the function from the nativeAPI stubs is called
                "next previous"     : _.bind(function() {
                    return this.playSound();
                }, this),
                "itemview:buy"      : this.buyItem
            });

            this.children.add(view, currency.id);

            // If the `render` flag is provided, i.e. a category
            // was externally added, render it!
            if (options && options.render === true) this.appendCurrencyView(view);
        },
        addOfferWallsLinkView : function(options) {

            this.offerWallsLink = new MenuLinkView({
                className : "item offer-walls"
            }).on("select", function() {
                this.playSound().changeActiveView(offerWallsId, offerWallsTitle);
            }, this);


            // If the `render` flag is provided, i.e. an offer wall
            // was externally added, render it!
            if (options && options.render === true) {
                this.appendOfferWallsLinkView(this.offerWallsLink);

                // Refresh iscroll to support adding more currencies from dashboard
                var menu = this.children.findByCustom("menu");
                menu.refreshIScroll();
            }

            return this;
        },

        addOfferWallsView : function(offerWalls, options) {

            var view = new OfferWallsCollectionView({
                className       : "items offerWalls category",
                collection      : offerWalls,
                templateHelpers : this.entityTemplateHelpers
            }).on({
                // This is a special playSound function that resolves the playSound
                // function defined on the store view object only when called.
                // This is used so that the function from the nativeAPI stubs is called
                "next previous" : _.bind(function() {
                    return this.playSound();
                }, this),
                "itemview:select" : function(view) {
                    this.wantsToOpenOfferWall(view.model.id);
                }
            });

            this.children.add(view, offerWallsId);

            // If the `render` flag is provided, i.e. an offer wall
            // was externally added, render it!
            if (options && options.render === true) this.appendOfferWallView(view);
        },
        removeOfferWallsView : function() {
            return this._removeContainerView({id : offerWallsId});
        },
        removeOfferWallsLink : function() {
            this.offerWallsLink.close();
            delete this.offerWallsLink;
        },
        _removeContainerView : function(container) {
            var view = this.children.findByCustom(container.id);
            view.close();
            this.children.remove(view);
            return this;
        },
        appendOfferWallsLinkView : function(link) {
            this._appendContainerView(link);
        },
        _appendContainerView : function(view) {
            this.ui.categoriesContainer.append(view.render().el);
        }
    });
    StoreView.mixinActiveTouchEmulation();

    _.extend(StoreView.prototype, {
        appendCategoryView : StoreView.prototype._appendContainerView,
        appendCurrencyView : StoreView.prototype._appendContainerView,
        appendOfferWallView: StoreView.prototype._appendContainerView,
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
