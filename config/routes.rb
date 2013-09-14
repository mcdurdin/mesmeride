Mesmeride::Application.routes.draw do
  #get "strava_activity/new"

  match '/auth/:provider/callback', :to => 'sessions#create', via: 'get'
  root 'static_pages#home'
  resources :sessions, only: [:create, :destroy]
  resources :strava_activities, only: [:create]
  resources :routes do
    # only: [:index, :new, :edit, :show, :create, :update, :destroy]
    resources :waypoints, only: [:index, :create, :destroy]
  end

  #match '/routes', :to => 'routes#index', via: 'get'
  #match '/routes/new', :to => 'routes#new', via: 'get'
  #match '/routes/:id', :to => 'routes#show', via: 'get'
  match '/routes/:id/image_save', :to => 'routes#image_save', via: 'post'
  
  match '/get_activity',  to: 'strava_activities#new', via: 'get'
  
  match '/help', to: 'static_pages#help', via: 'get'
  match '/about', to: 'static_pages#about', via: 'get'
  match '/contact', to: 'static_pages#contact', via: 'get'
  match '/signin',  to: 'static_pages#signin', via: 'get'
  match '/signout', to: 'sessions#destroy', via: 'delete'
  
  # The priority is based upon order of creation: first created -> highest priority.
  # See how all your routes lay out with "rake routes".

  # You can have the root of your site routed with "root"
  # root 'welcome#index'

  # Example of regular route:
  #   get 'products/:id' => 'catalog#view'

  # Example of named route that can be invoked with purchase_url(id: product.id)
  #   get 'products/:id/purchase' => 'catalog#purchase', as: :purchase

  # Example resource route (maps HTTP verbs to controller actions automatically):
  #   resources :products

  # Example resource route with options:
  #   resources :products do
  #     member do
  #       get 'short'
  #       post 'toggle'
  #     end
  #
  #     collection do
  #       get 'sold'
  #     end
  #   end

  # Example resource route with sub-resources:
  #   resources :products do
  #     resources :comments, :sales
  #     resource :seller
  #   end

  # Example resource route with more complex sub-resources:
  #   resources :products do
  #     resources :comments
  #     resources :sales do
  #       get 'recent', on: :collection
  #     end
  #   end
  
  # Example resource route with concerns:
  #   concern :toggleable do
  #     post 'toggle'
  #   end
  #   resources :posts, concerns: :toggleable
  #   resources :photos, concerns: :toggleable

  # Example resource route within a namespace:
  #   namespace :admin do
  #     # Directs /admin/products/* to Admin::ProductsController
  #     # (app/controllers/admin/products_controller.rb)
  #     resources :products
  #   end
end
