module ApplicationHelper

  require 'open-uri'
  
  # Returns the full title on a per-page basis.
  def full_title(page_title)
    base_title = "Mesmeride"
    if page_title.empty?
      base_title
    else
      "#{base_title} | #{page_title}"
    end
  end
  
  def get_strava_data(path)
    open("https://www.strava.com/api/v3/#{path}?access_token=#{current_user.authentications[0].access_token}").read
  end

  def new_child_fields_template(form_builder, association, options = {})
    options[:object] ||= form_builder.object.class.reflect_on_association(association).klass.new
    options[:partial] ||= association.to_s.singularize
    options[:form_builder_local] ||= :f

    content_for :jstemplates do
      content_tag(:tbody, :id => "#{association}_fields_template", :style => "display: none") do
        form_builder.fields_for(association, options[:object], :child_index => "new_#{association}") do |f|        
          render(:partial => options[:partial], :locals => { options[:form_builder_local] => f })        
        end
      end
    end
  end  

  def add_child_link(name, association, class_)
    link_to(name, "javascript:void(0)", :class => "add_child "+class_, :"data-association" => association)
  end
end