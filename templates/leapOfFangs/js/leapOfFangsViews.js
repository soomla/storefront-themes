define(["jquery", "backbone", "components", "handlebars", "templates", "jquery.fastbutton"], function($, Backbone, Components, Handlebars) {

    // Define view types

    var getTemplate = Handlebars.getTemplate,
        triggers = { "fastclick .buy" : "buy" },
        VirtualGoodView = Components.ItemView.extend({
            triggers : triggers,
            template : getTemplate("item")
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


    var extendViews = function(model) {

        var theme           = model.get("theme"),
            templateHelpers = { images : theme.images };


        // Add template helpers to view prototypes

        VirtualGoodView.prototype.templateHelpers = function() {
            var modelAssets = model.get("modelAssets");
            return _.extend({
                imgFilePath : modelAssets["virtualGoods"][this.model.id],
                currency : {
                    imgFilePath : modelAssets["virtualCurrencies"][this.model.getCurrencyId()]
                },
                price : this.model.get("priceModel").values[this.model.getCurrencyId()],
                item : theme.item
            }, templateHelpers);
        };
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
            this.dialogModel = this.theme.noFundsModal;


            var categories      = this.model.get("categories"),
                currencies      = this.model.get("virtualCurrencies"),
                templateHelpers = { images : this.theme.images },
                $this           = this;


            var onMenuItemSelect = function (view) {
                this.playSound().changeActiveView(view.model.id);
                this.changeTitle(view.model.get("name"));
            };


            // TODO: keep track of the active view amongst categories and currencies

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


            // Build views for each category
            categories.each(function(category) {

                var view = new CarouselView({
                    collection          : category.get("goods"),
                    itemView            : VirtualGoodView,
                    templateHelpers     : templateHelpers
                }).on({
                    "next"              : $this.playSound,
                    "previous"          : $this.playSound,
                    "itemview:buy"      : wantsToBuyVirtualGoods
                });

                // TODO: Add equipping

                $this.children.add(view, category.id);
            });


            // Build views for each currency
            currencies.each(function(currency) {

                var view = new CarouselView({
                    collection          : currency.get("packs"),
                    itemView            : CurrencyPackView,
                    templateHelpers     : templateHelpers
                }).on({
                    "next"              : $this.playSound,
                    "previous"          : $this.playSound,
                    "itemview:buy"      : wantsToBuyMarketItem
                });

                $this.children.add(view, currency.id);
            });


            // Set the active view to be the first category's view
            this.activeView = this.children.findByIndex(0);
        },
        changeTitle : function(text) {
            // TODO: Extract to header view that listens to active title changes
            this.ui.title.html(text);
        },
        changeActiveView : function(id) {
            this.activeView.$el.removeClass("active");
            this.activeView = this.children.findByCustom(id);
            this.activeView.$el.addClass("active");
            return this;
        },
        showCurrencyPacks : function(currencyId) {
            this.changeActiveView(currencyId);
            var name = this.model.get("virtualCurrencies").get(currencyId).get("name");
            this.changeTitle(name);
        },
        ui : {
            title: "#title",
            categoriesContainer : "#categories"
        },
        events : {
            "fastclick #quit" : "leaveStore"
        },
        onRender : function() {

            // Append background to element
            // TODO: Remove once this CSS property is injected dynamically from template.json definition
            this.$el.css("background-image", "url('" + this.theme.images.globalBackground + "')");

            // Show first category name in header
            this.changeTitle(this.model.get("categories").at(0).get("name"));

            // Render category menu
            // TODO: Render in separate template
            this.categoryMenu.setElement("#category-menu").render();
            this.currencyMenu.setElement("#currency-menu").render();

            var $this = this;
            this.children.each(function(view) {
                $this.ui.categoriesContainer.append(view.render().el);
            });

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
