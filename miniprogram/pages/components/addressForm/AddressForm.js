// pages/components/AddressForm.js
const  app =getApp();
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    address:{
      type:Object,
      value:{}
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
      address:{
        
      },
    postcode: '102200',
      region:['北京市','北京市','昌平区'],
    
  },

  /**
   * 组件的方法列表
   */
  methods: {
    submitAddress:function(event){
      console.log('methods submitAddress ',event);
      const detail = event.detail;
      var consignee = detail.value.consignee;
      var phone = detail.value.phone;
      var street = detail.value.street;
      if(consignee.length==0){
        app.showToast('请填写收货人');
        return;
      }
      if (phone.length == 0) {
        app.showToast('请填写手机号');
        return;
      }
      if(phone.length!=11){
        app.showToast('手机号码是11位！');
        return;
      }
      if(street.length==0){
        app.showToast('请填写详细街道');
        return;
      }
      var address = this.data.address;
      address.consignee = consignee;
      address.phone = phone;
      address.street = street;
      address.postcode = this.data.postcode;
      address.region = this.data.region;
      this.triggerEvent('submitAddress',address);
    },
    bindRegionChange:function(event){
      console.log('bindRegionChange',event);
      this.setData({
        region: event.detail.value,
        postcode: event.detail.postcode
      })
    }
  }
})
