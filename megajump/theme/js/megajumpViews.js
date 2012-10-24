define(["jquery", "backbone", "components", "handlebars", "templates"], function($, Backbone, Components, Handlebars) {

    var HeaderView = Backbone.View.extend({
        initialize : function() {
            _.bindAll(this, "switchHeader");
            this.state = "menu";
        },
        events : {
            "click .back" : function() {
                this.trigger(this.state == "menu" ? "quit" : "back");
            }
        },
        switchHeader : function(titleImage, backImage) {
            this.$(".title-image").attr("src", titleImage);
            this.$(".back img").attr("src", backImage);
        }
    });

    var CarouselView = Components.CarouselView.extend({
        itemViewContainer : ".list-items"
    });


    var StoreView = Components.BaseStoreView.extend({
        initialize : function() {
            _.bindAll(this, "wantsToLeaveStore", "updateBalance",
                            "render", "openDialog",
                            "switchCategory", "showMenu",
                            "wantsToBuyVirtualGoods", "wantsToBuyCurrencyPacks");

            this.nativeAPI  = this.options.nativeAPI || window.SoomlaNative;
            this.theme      = this.model.get("theme");

            this.model.get("virtualCurrencies").on("change:balance", this.updateBalance);


            var virtualGoods    = this.model.get("virtualGoods"),
                currencyPacks   = this.model.get("currencyPacks"),
                categories      = this.model.get("categories"),
                templateHelpers = { images : this.theme.images },
                $this           = this;

            // Prepare triggers for virtual good views
            var triggers = { "click .buy" : "buy" };
            if (top.enablePointingDeviceEvents) triggers["touchend .buy"] = "buy";

            var VirtualGoodView = Components.ListItemView.extend({
                tagName         : "div",
                triggers        : triggers,
                template        : Handlebars.getTemplate("item"),
                templateHelpers : templateHelpers,
                css             : { "background-image" : "url('" + this.theme.images.itemBackgroundImage + "')" }
            });
            var CurrencyPackView = Components.ListItemView.extend({
                template        : Handlebars.getTemplate("currencyPack"),
                templateHelpers : templateHelpers,
                css             : { "background-image" : "url('" + this.theme.images.itemBackgroundImage + "')" }
            });
            var CategoryMenuItemView = Components.ListItemView.extend({
                template        : Handlebars.getTemplate("categoryMenuItem")
            });


           // Build a category menu that will cause the main area
           // to switch categories every time a menu item is selected, using tabs
           this.categoryMenu = new Components.CollectionListView({
                collection          : categories,
                itemView            : CategoryMenuItemView,
                onRender            : function() {
                    // Activate tabs
                    this.$("li:first").addClass("active");
                }
            }).on("itemview:selected", function(view) {
                view.$("a").tab("show");
               $this.activeView = $this.categoryViews[view.model.get("name")];
            });



            this.categoryViews = {};
            categories.each(function(category) {

                var categoryGoods = virtualGoods.filter(function(item) {return item.get("categoryId") == category.id});
                categoryGoods = new Backbone.Collection(categoryGoods);
                var categoryName = category.get("name");

                var view = new CarouselView({
                    className           : "items virtualGoods category " + categoryName,
                    category            : category,
                    collection          : categoryGoods,
                    itemView            : VirtualGoodView,
                    template            : Handlebars.getTemplate("category"),
                    templateHelpers     : templateHelpers
                }).on("buy", $this.wantsToBuyVirtualGoods);

                $this.categoryViews[categoryName] = view;
            });


            // Build the currency packs carousel and place it last
            // in the category views
            this.currencyPacksView = new Components.CollectionListView({
                className           : "items currencyPacks category",
                collection          : currencyPacks,
                itemView            : CurrencyPackView,
                category            : new Backbone.Model({name : "currencyPacks"})  // Hack the category name in
            }).on("bought", this.wantsToBuyCurrencyPacks);
            this.categoryViews["currencyPacks"] = this.currencyPacksView;

            this.activeView = this.categoryViews[categories.at(0).get("name")];

            categories.add({name : "currencyPacks"});

            this.header = new HeaderView().on("back", this.showMenu).on("quit", this.wantsToLeaveStore);

        },
        switchCategory : function(model) {
            this.header.state = "category";
            var category = model.get("name");
            this.$(".menu").hide();
            this.$(".category").hide();
            this.$(".category." + category).show();
            this.header.switchHeader(this.theme.pages[category].title, this.theme.images.backImage);
        },
        showMenu : function() {
            this.header.state = "menu";
            this.$(".menu").show();
            this.$(".category").hide();
            this.header.switchHeader(this.theme.pages.menu.title, this.theme.images.quitImage);
        },
        updateBalance : function(model) {
            this.$(".balance-container label").html(model.get("balance"));
        },
        openDialog : function(currency) {
            this.createDialog({model : this.theme.noFundsModal}).render();
            return this;
        },
        onRender : function() {

            // Render header
            this.header.setElement(this.$(".header"));

            // Render category menu
            this.categoryMenu.setElement("#category-menu").render();

            var $this = this;
            _.each(this.categoryViews, function(view) {
                $this.$("#categories").append(view.render().el);
                view.$el.attr("id", view.options.category.get("name"));
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