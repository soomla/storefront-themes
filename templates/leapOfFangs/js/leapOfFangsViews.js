define(["jquery", "backbone", "components", "handlebars", "templates"], function($, Backbone, Components, Handlebars) {

    // Define view types

    var getTemplate = Handlebars.getTemplate,
        triggers = { "click .buy" : "buy" },
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
    };


    var StoreView = Components.BaseStoreView.extend({
        initialize : function() {
            _.bindAll(this, "changeTitle", "showCurrencyPacks");
            this.dialogModel = this.theme.noFundsModal;


            var currencyPacks   = this.model.get("virtualCurrencies").at(0).get("packs"),
                categories      = this.model.get("categories"),
                templateHelpers = { images : this.theme.images },
                $this           = this;


            // TODO: Fix the image for currency packs link.  It's not being passed in the template helpers for some reason...

            // Build a category menu that will cause the main area
            // to switch categories every time a menu item is selected, using tabs.
            // In order to extend the categories with a "currency packs" category,
            // we need to clone the original collection
            var menuCategories = new Backbone.Collection(categories.toJSON());
            this.currencyPacksId = "currency-packs"
            menuCategories.add({name : this.currencyPacksId, imgFilePath : this.model.get("modelAssets").currencyPacksCategory});
            this.categoryMenu = new Components.CollectionView({
                collection          : menuCategories,
                itemView            : CategoryMenuItemView,
                onRender            : function() {
                    // Activate tabs
                    this.$("li:first").addClass("active");
                }
            }).on("itemview:select", function(view) {
                $this.playSound();

                view.$("a").tab("show");
                var name = view.model.get("name");

                // If the selected category is currency packs, take title from specific
                // field in JSON, since currency packs don't have a category and a name
                if (name == $this.currencyPacksId) name = $this.theme.currencyPacksCategoryName;

                $this.activeView = $this.categoryViews[name];
                $this.changeTitle(name);
            });

            var wantsToBuyVirtualGoods = _.bind(function(view) {
                this.playSound().wantsToBuyVirtualGoods(view.model);
            }, this);
            var wantsToBuyMarketItem = _.bind(function(view) {
                this.playSound().wantsToBuyMarketItem(view.model);
            }, this);


            // Build views for each category
            this.categoryViews = {};
            categories.each(function(category) {

                var categoryName = category.get("name");

                var view = new CarouselView({
                    id                  : categoryName,
                    collection          : category.get("goods"),
                    itemView            : VirtualGoodView,
                    templateHelpers     : templateHelpers
                }).on({
                    "next"              : $this.playSound,
                    "previous"          : $this.playSound,
                    "itemview:buy"      : wantsToBuyVirtualGoods
                });

                $this.categoryViews[categoryName] = view;
            });


            // Build the currency packs carousel and place it last
            // in the category views
            this.currencyPacksView = new CarouselView({
                id                  : this.currencyPacksId,  // Hack the category name in
                collection          : currencyPacks,
                itemView            : CurrencyPackView,
                templateHelpers     : templateHelpers
            }).on({
                "next"              : this.playSound,
                "previous"          : this.playSound,
                "itemview:buy"      : wantsToBuyMarketItem
            });
            this.categoryViews[this.currencyPacksId] = this.currencyPacksView;

            // Set the active view to be the first category's view
            this.activeView = this.categoryViews[categories.at(0).get("name")];
        },
        changeTitle : function(text) {
            this.$("#title").html(text);
        },
        showCurrencyPacks : function() {
            // When this flag is raised, there is no connectivity,
            // thus don't show the currency store
            if (this.model.get("isCurrencyStoreDisabled")) {
                alert("Buying more is unavailable. Check your internet connectivity and try again.");
            } else {
                this.$("[href=#" + this.currencyPacksId + "]").tab("show");
                var name = this.theme.currencyPacksCategoryName;
                this.activeView = this.categoryViews[name];
                this.changeTitle(name);
            }
        },
        onRender : function() {

            // Append background to element
            // TODO: Remove once this CSS property is injected dynamically from template.json definition
            this.$el.css("background-image", "url('" + this.theme.images.globalBackground + "')");

            // Show first category name in header
            this.changeTitle(this.model.get("categories").at(0).get("name"));

            // Attach event handler to quit button
            this.$("#quit").click(this.leaveStore);

            // Render category menu
            this.categoryMenu.setElement("#category-menu").render();

            var $this = this;
            _.each(this.categoryViews, function(view) {
                $this.$("#categories").append(view.render().el);
            });
            this.$("#categories > div:first").addClass("active");
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
