define(["jquery", "backbone", "components", "handlebars", "marionette", "templates", "jquery.fastbutton"], function($, Backbone, Components, Handlebars, Marionette) {

    // Define view types

    var getTemplate = Handlebars.getTemplate,
        triggers = { "fastclick .buy" : "buy" },
        VirtualGoodView = Components.ItemView.extend({
            triggers : triggers,
            template : getTemplate("item")
        }),
        EquippableItemView = Components.EquippableItemView.extend({

            // Local triggers not included, they are inherited from EquippableItemView
            template : getTemplate("equippableItem")
        }),
        CurrencyPackView = Components.ItemView.extend({
            triggers : triggers,
            template : getTemplate("currencyPack")
        }),
        CategoryMenuItemView = Components.ItemView.extend({
            template : getTemplate("categoryMenuItem")
        }),
        CurrencyMenuItemView = CategoryMenuItemView.extend(),
        CarouselView = Components.CarouselView.extend({
            className           : "category",
            itemViewContainer   : ".goods",
            template            : getTemplate("category")
        });


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
            templateHelpers = { images : theme.images };


        // Add template helpers to view prototypes

        var virtualGoodTemplateHelpers = function () {
            var modelAssets = model.get("modelAssets");
            return _.extend({
                imgFilePath: modelAssets["virtualGoods"][this.model.id],
                currency: {
                    imgFilePath: modelAssets["virtualCurrencies"][this.model.getCurrencyId()]
                },
                price: this.model.get("priceModel").values[this.model.getCurrencyId()],
                item: theme.item
            }, templateHelpers);
        };
        VirtualGoodView.prototype.templateHelpers = virtualGoodTemplateHelpers;
        EquippableItemView.prototype.templateHelpers = virtualGoodTemplateHelpers;

        CurrencyPackView.prototype.templateHelpers = function() {
            var modelAssets = model.get("modelAssets");
            return _.extend({
                imgFilePath : modelAssets["currencyPacks"][this.model.id],
                currency : {
                    imgFilePath : modelAssets["virtualCurrencies"][this.model.get("currency_itemId")]
                },
                item : theme.item
            }, templateHelpers);
        };
        CategoryMenuItemView.prototype.templateHelpers = function() {
            var modelAssets = model.get("modelAssets");
            return {
                imgFilePath : modelAssets["categories"][this.model.id]
            };
        };
        CurrencyMenuItemView.prototype.templateHelpers = function() {
            var modelAssets = model.get("modelAssets");
            return {
                imgFilePath : modelAssets["virtualCurrencies"][this.model.id]
            };
        };
    };


    var StoreView = Components.BaseStoreView.extend({
        initialize : function() {
            this.dialogModal = this.theme.noFundsModal;
            this.loadingModal = {
                "text": "Loading...",
                "background": this.dialogModal.background,
                "textStyle": this.dialogModal.textStyle
            };

            var categories      = this.model.get("categories"),
                currencies      = this.model.get("virtualCurrencies"),
                templateHelpers = { images : this.theme.images };


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

            var wantsToBuyVirtualGoods = _.bind(function(view) {
                this.playSound().wantsToBuyVirtualGoods(view.model);
            }, this);
            var wantsToBuyMarketItem = _.bind(function(view) {
                this.playSound().wantsToBuyMarketItem(view.model);
            }, this);
            var wantsToEquipGoods = _.bind(function (view) {
                this.playSound().wantsToEquipGoods(view.model);
            }, this);


            // Build views for each category
            categories.each(function(category) {

                var categoryGoods   = category.get("goods"),
                    equipping       = category.get("equipping"),
                    view;

                if (equipping === "single") {
                    view = new CarouselView({
                        collection          : categoryGoods,
                        itemView            : EquippableItemView,
                        templateHelpers     : templateHelpers
                    }).on({
                        "next previous"     : this.playSound,
                        "itemview:buy"      : wantsToBuyVirtualGoods,
                        "itemview:equip" 	: wantsToEquipGoods
                    });
                } else {
                    view = new CarouselView({
                        collection          : categoryGoods,
                        itemView            : VirtualGoodView,
                        templateHelpers     : templateHelpers
                    }).on({
                        "next previous"     : this.playSound,
                        "itemview:buy"      : wantsToBuyVirtualGoods
                    });
                }

                this.children.add(view, category.id);
            }, this);


            // Build views for each currency
            currencies.each(function(currency) {

                var view = new CarouselView({
                    collection          : currency.get("packs"),
                    itemView            : CurrencyPackView,
                    templateHelpers     : templateHelpers
                }).on({
                    "next previous"     : this.playSound,
                    "itemview:buy"      : wantsToBuyMarketItem
                });

                this.children.add(view, currency.id);
            }, this);


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
            this.activeView.$el.addClass("active");
            this.changeTitle(title);
            return this;
        },
        changeViewToItem: function (itemId) {
            if (!itemId)
                return;

            var currencyPacksItem = this.model.currencyPacksMap[itemId];
            if (currencyPacksItem) {
                var currency = currencyPacksItem.get("currency_itemId");
                this.showCurrencyPacks(currency);
                this.activeView.changeActiveByModel(currencyPacksItem);
                return;
            }

            var goodsItem = this.model.goodsMap[itemId];
            if (goodsItem) {
                var categoryId = goodsItem.get('categoryId'),
                    categroy = this.model.get('categories').get(categoryId);
                this.changeActiveViewByModel(categroy);
                this.activeView.changeActiveByModel(goodsItem);
                return;
            }

            console.log('View was not changed. Could not find item: "' + itemId + '".');
        },
        showCurrencyPacks: function (currencyId) {
            var currency = this.model.get("virtualCurrencies").get(currencyId);
            this.changeActiveViewByModel(currency);
        },
        ui : {
            categoriesContainer : "#categories"
        },
        regions: {
            categoryMenu : "#category-menu",
            currencyMenu : "#currency-menu",
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
        onRender : function() {

            // Render regions
            _.each(this.regions, function(selector, region) {
                this[region].setElement(selector).render();
            }, this);


            this.children.each(function(view) {
                this.ui.categoriesContainer.append(view.render().el);
            }, this);

            // Assumes that the active view is the first category view
            this.activeView.$el.addClass("active");
        },
        zoomFunction : function() {
            return (innerHeight / innerWidth) > 1.5 ? (innerWidth / 720) : (innerHeight / 1280);
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
