package SWE::DB::IDText;
use strict;

require SWE::DB::IDProps;
push our @ISA, 'SWE::DB::IDProps';

sub new ($) {
  my $self = shift->SUPER::new (@_);
  $self->{leaf_suffix} = '.txt';
  return $self;
} # new

sub get_data ($$) {
  my $self = shift;
  my $file_name = $self->_get_file_name ($_[0]);

  unless (-f $file_name) {
    return undef;
  }

  open my $file, '<:encoding(utf8)', $file_name or die "$0: $file_name: $!";
  local $/ = undef;
  return \ (<$file>);
} # get_data

sub set_data ($$$) {
  my $self = shift;
  my $file_name = $self->_get_file_name ($_[0], 1);
  my $textref = $_[1];
  
  my $has_file = -f $file_name;
  
  open my $file, '>:encoding(utf8)', $file_name or die "$0: $file_name: $!";
  print $file $$textref;

## TODO: cvs
} # set_data

1;
