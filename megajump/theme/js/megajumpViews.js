define(["jquery", "backbone", "components", "handlebars", "templates"], function($, Backbone, Components, Handlebars) {

    var CarouselView = Components.CarouselView.extend({
        className           : "category",
        itemViewContainer   : ".goods",
        template            : Handlebars.getTemplate("category")
    });


    var StoreView = Components.BaseStoreView.extend({
        initialize : function() {
            _.bindAll(this, "wantsToLeaveStore",
                            "render", "changeTitle", "showCurrencyStore",
                            "wantsToBuyVirtualGoods", "wantsToBuyCurrencyPacks");

            this.nativeAPI   = this.options.nativeAPI || window.SoomlaNative;
            this.theme       = this.model.get("theme");
            this.dialogModel = this.theme.noFundsModal;

            this.model.get("virtualCurrencies").on("change:balance", this.updateBalance, this);


            var virtualGoods    = this.model.get("virtualGoods"),
                currencyPacks   = this.model.get("currencyPacks"),
                categories      = this.model.get("categories"),
                templateHelpers = { images : this.theme.images },
                $this           = this;

            // Prepare triggers for virtual good views
            var triggers = { "touchend .buy" : "buy" };
            if (top.enablePointingDeviceEvents) triggers["click .buy"] = "buy";

            var VirtualGoodView = Components.ListItemView.extend({
                tagName         : "div",
                triggers        : triggers,
                template        : Handlebars.getTemplate("item"),
                templateHelpers :_.extend({item : this.theme.item}, templateHelpers)
            });
            var CurrencyPackView = Components.ListItemView.extend({
                tagName         : "div",
                triggers        : triggers,
                template        : Handlebars.getTemplate("currencyPack"),
                templateHelpers :_.extend({item : this.theme.item}, templateHelpers)
            });
            var CategoryMenuItemView = Components.ListItemView.extend({
                template        : Handlebars.getTemplate("categoryMenuItem")
            });


            // Build a category menu that will cause the main area
            // to switch categories every time a menu item is selected, using tabs.
            // In order to extend the categories with a "currency packs" category,
            // we need to clone the original collection
            var menuCategories = new Backbone.Collection(categories.toJSON());
            this.currencyPacksId = "currency-packs"
            menuCategories.add({name : this.currencyPacksId, imgFilePath : this.model.get("modelAssets").currencyPacksCategory});
            this.categoryMenu = new Components.CollectionListView({
                collection          : menuCategories,
                itemView            : CategoryMenuItemView,
                onRender            : function() {
                    // Activate tabs
                    this.$("li:first").addClass("active");
                }
            }).on("itemview:selected", function(view) {
                view.$("a").tab("show");
                var name = view.model.get("name");

                // If the selected category is currency packs, take title from specific
                // field in JSON, since currency packs don't have a category and a name
                if (name == $this.currencyPacksId) name = $this.theme.currencyPacksCategoryName;

                $this.activeView = $this.categoryViews[name];
                $this.changeTitle(name);
            });


            // Build views for each category
            this.categoryViews = {};
            categories.each(function(category) {

                // Filter a collection of goods associated with the current category
                var categoryGoods = virtualGoods.filter(function(item) {return item.get("categoryId") == category.id});
                categoryGoods = new Backbone.Collection(categoryGoods);
                var categoryName = category.get("name");

                var view = new CarouselView({
                    id                  : categoryName,
                    collection          : categoryGoods,
                    itemView            : VirtualGoodView,
                    templateHelpers     : templateHelpers
                }).on("itemview:buy", function(view) { $this.wantsToBuyVirtualGoods(view.model); });

                $this.categoryViews[categoryName] = view;
            });


            // Build the currency packs carousel and place it last
            // in the category views
            this.currencyPacksView = new CarouselView({
                id                  : this.currencyPacksId,  // Hack the category name in
                collection          : currencyPacks,
                itemView            : CurrencyPackView,
                templateHelpers     : templateHelpers
            }).on("itemview:buy", function(view) { $this.wantsToBuyCurrencyPacks(view.model); });
            this.categoryViews[this.currencyPacksId] = this.currencyPacksView;

            // Set the active view to be the first category's view
            this.activeView = this.categoryViews[categories.at(0).get("name")];
        },
        changeTitle : function(text) {
            this.$("#title").html(text);
        },
        showCurrencyStore : function() {
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
            this.$el.css("background-image", "url('" + this.theme.images.globalBackground + "')");

            // Show first category name in header
            this.changeTitle(this.model.get("categories").at(0).get("name"));

            // Attach event handler to quit button
            this.$("#quit").click(this.wantsToLeaveStore);

            // Render category menu
            this.categoryMenu.setElement("#category-menu").render();

            var $this = this;
            _.each(this.categoryViews, function(view) {
                $this.$("#categories").append(view.render().el);
            });
            this.$("#categories > div:first").addClass("active");

            // Adjust zoom to fit nicely in viewport
            // This helps cope with various viewports, i.e. mobile, tablet...
            var adjustBodySize = function() {
                var ratio = (innerHeight / innerWidth) > 1.5 ? (innerWidth / 720) : (innerHeight / 1280);
                $("body").css("zoom", ratio);
            };
            $(window).resize(adjustBodySize);
            adjustBodySize();

            // TODO: Add -webkit-text-size-adjust for iOS devices
        }
    });


    return {
        StoreView : StoreView
    };
});