const mock = {
    plans: [
      { id:"A", title:"Quick Wins", summary:"Fast boost via on‑ramp tradelines.", unlocked_app_index:0,
        apps:[
          { app_id:"experian_boost", app_name:"Experian Boost", app_url:"https://www.experian.com/boost",
            why:"Reports utilities/streaming to increase thin files.",
            setup_steps:["Connect bank","Select bills","Verify"]
          }
        ]
      },
      { id:"B", title:"Builder Mix", summary:"Starter builder lines + utility reporting.", unlocked_app_index:0, apps:[] },
      { id:"C", title:"Secure & Grow", summary:"Secured card + on-time autopay routine.", unlocked_app_index:0, apps:[] },
      { id:"D", title:"Long Game", summary:"Age + limits + utilization discipline.", unlocked_app_index:0, apps:[] }
    ]
  };
  export default mock;
  