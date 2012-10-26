define(["jquery", "backbone", "components", "marionette", "handlebars", "templates"], function($, Backbone, Components, Marionette, Handlebars) {

    var StoreView = Components.BaseStoreView.extend({
        initialize : function() {
            _.bindAll(this, "wantsToLeaveStore",
                            "render", "showCurrencyStore", "showGoodsStore",
                            "wantsToBuyVirtualGoods", "wantsToBuyCurrencyPacks");

            this.nativeAPI      = this.options.nativeAPI || window.SoomlaNative;
            this.theme          = this.model.get("theme");
            this.dialogModel    = this.theme.pages.goods.noFundsModal;
            this.categoryViews  = [];

            this.model.get("virtualCurrencies").on("change:balance", this.updateBalance, this);
            var $this        = this,
                categories   = this.model.get("categories"),
                virtualGoods = this.model.get("virtualGoods");


            var sharedGoodsOptions = {
                template        : Handlebars.getTemplate("item"),
                templateHelpers : _.extend({
                    balanceLabelStyle   : this.theme.common.balanceLabelStyle,
                    itemSeparator       : this.theme.itemSeparator
                }, this.theme.pages.goods.listItem),
                css             : { "background-image" : "url('" + $this.theme.pages.goods.listItem.background + "')" }
            };
            var VirtualGoodView = Components.ListItemView.extend(_.extend({
                triggers : {
                    "click .buy" : "buy"
                }
            }, sharedGoodsOptions));

            var EquippableVirtualGoodView = Components.EquippableListItemView.extend(sharedGoodsOptions);

            var CurrencyPackView = Components.ListItemView.extend({
                template        : Handlebars.getTemplate("currencyPack"),
                templateHelpers : {
                    nameStyle       : this.theme.pages.currencyPacks.listItem.nameStyle,
                    priceStyle      : this.theme.pages.currencyPacks.listItem.priceStyle,
                    itemSeparator   :$this.theme.itemSeparator
                },
                css             : { "background-image" : "url('" + this.theme.pages.currencyPacks.listItem.balanceBackground + "')" }
            });

            var SectionedListView = Marionette.CompositeView.extend({
                tagName             : "div",
                className           : "items virtualGoods",
                template            : Handlebars.getTemplate("listContainer"),
                itemViewContainer   : ".container"
            });

            categories.each(function(category) {
                var categoryGoods = virtualGoods.filter(function(item) {return item.get("categoryId") == category.id});
                categoryGoods = new Backbone.Collection(categoryGoods);
                var view;

                if (category.get("name") != "FRIENDS") {
                    view = new SectionedListView({
                        collection          : categoryGoods,
                        itemView            : VirtualGoodView,
                        templateHelpers     :_.extend({category : category.get("name")}, $this.theme.categories)
                    }).on("buy", $this.wantsToBuyVirtualGoods);
                } else {
                    view = new SectionedListView({
                        collection          : categoryGoods,
                        itemView            : EquippableVirtualGoodView,
                        templateHelpers     :_.extend({category : category.get("name")}, $this.theme.categories)
                    }).on({
                        "buy" : $this.wantsToBuyVirtualGoods,
                        "itemview:equip" : function(view) {
                            $this.wantsToEquipGoods(view.model);
                        },
                        "itemview:equipped" : function(view) {

                            // Make sure to UI-unequip the previous one
                            if (this.equippedView) {
                                this.equippedView.model.set("equipped", false);
                            }
                            this.equippedView = view;
                        }
                    });
                }
                $this.categoryViews.push(view);
            });
            this.currencyPacksView = new Components.CollectionListView({
                className           : "items currencyPacks",
                collection          : this.model.get("currencyPacks"),
                itemView            : CurrencyPackView
            }).on("selected", this.wantsToBuyCurrencyPacks);

        },
        events : {
            "touchend .leave-store" : "wantsToLeaveStore",
            "touchend .buy-more"    : "showCurrencyStore",
            "touchend .back"        : "showGoodsStore"
        },
        updateBalance : function(model) {
            this.$(".balance-container label").html(model.get("balance"));
        },
        showCurrencyStore : function() {
            // When this flag is raised, there is no connectivity,
            // thus don't show the currency store
            if (this.model.get("isCurrencyStoreDisabled")) {
                alert("Buying more " + this.model.get("currency").get("name") + " is unavailable. Check your internet connectivity and try again.");
            } else {
                this.$("#goods-store").hide();
                this.$("#currency-store").show();
            }
        },
        showGoodsStore : function() {
            this.$("#currency-store").hide();
            this.$("#goods-store").show();
        },
        onRender : function() {
            var $this = this;
            this.$("#currency-store").hide();

            // Render subviews (items in goods store and currency store)
            _.each(this.categoryViews, function(view) {
                $this.$("#goods-store .items-container").append(view.render().el);
            });
            this.$("#currency-store .items-container").html(this.currencyPacksView.render().el);

            // Adjust zoom to fit nicely in viewport
            // This helps cope with various viewports, i.e. mobile, tablet...
            var adjustBodySize = function() {
                $("body").css("zoom", Math.min(innerWidth / 560, 1));
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