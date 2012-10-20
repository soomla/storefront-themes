package com.soomla.example.templeRun;

import android.content.Context;
import android.widget.Toast;
import com.soomla.store.IStoreEventHandler;
import com.soomla.store.StoreConfig;
import com.soomla.store.domain.data.GoogleMarketItem;
import com.soomla.store.domain.data.VirtualCurrencyPack;
import com.soomla.store.domain.data.VirtualGood;

public class ExampleEventHandler implements IStoreEventHandler {

    private Context mContext;
    private StoreExampleActivity mActivityI;
    public ExampleEventHandler(Context context, StoreExampleActivity activityI){
        mContext = context;
        mActivityI = activityI;
    }

    @Override
    public void onMarketPurchase(GoogleMarketItem googleMarketItem) {
        showToastIfDebug(googleMarketItem.getProductId() + " was just purchased");
    }

    @Override
    public void onMarketRefund(GoogleMarketItem googleMarketItem) {
        showToastIfDebug(googleMarketItem.getProductId() + " was just refunded");
    }

    @Override
    public void onVirtualGoodPurchased(VirtualGood good) {
        showToastIfDebug(good.getName() + " was just purchased");
    }

    @Override
    public void onVirtualGoodEquipped(VirtualGood good) {
        showToastIfDebug(good.getName() + " was just equipped");
    }

    @Override
    public void onVirtualGoodUnequipped(VirtualGood good) {
        showToastIfDebug(good.getName() + " was just unequipped");
    }

    @Override
    public void onBillingSupported() {
        showToastIfDebug("Billing is supported");
    }

    @Override
    public void onBillingNotSupported() {
        showToastIfDebug("Billing is not supported");
    }

    @Override
    public void onMarketPurchaseProcessStarted(GoogleMarketItem googleMarketItem) {
        showToastIfDebug("Market purchase started for productId: " + googleMarketItem.getProductId());
    }

    @Override
    public void onGoodsPurchaseProcessStarted() {
        showToastIfDebug("Goods purchase started");
    }

    @Override
    public void onClosingStore() {
        mActivityI.robotBackHome();

        showToastIfDebug("Going to close store");
    }

    @Override
    public void onUnexpectedErrorInStore() {
        showToastIfDebug("Unexpected error occurred !");
    }

    @Override
    public void onOpeningStore() {
        showToastIfDebug("Store is opening");
    }

    private void showToastIfDebug(String msg) {
        if (StoreConfig.debug){
            Toast toast = Toast.makeText(mContext, msg, 5000);
            toast.show();
        }
    }
}
